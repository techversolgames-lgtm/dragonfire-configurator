import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import styles from "@/styles/dom/DragonfireTools/DragonfireQuoteSidebarPanel.module.scss";
import useDragNDropStore from "@/stores/useDragNDropStore";
import useAnimationStore from "@/stores/useAnimationStore";
import { generateDragonfireQuotePDF } from "@/data/DragonfireTools/dragonfire_quote_generator";
import { aggregateCabinetLines } from "@/data/DragonfireTools/dragonfire_quote_lines";
import {
  sendDragonfireQuoteEmail,
  triggerDragonfireQuotePdfDownload,
} from "@/data/DragonfireTools/send_dragonfire_quote_email";
import {
  getDragonfireQuoteScreenshotOrbitDistance,
  getDragonfireQuoteTopViewOrbitDistance,
  DRAGONFIRE_QUOTE_SCREENSHOT_SETTLE_MS,
  DRAGONFIRE_QUOTE_UPPER_CORNER_SHOTS,
} from "@/data/DragonfireTools/quoteScreenshotConstants";

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function makeRequestId() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch (e) {
    // ignore
  }
  return `rf_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

const schema = z.object({
  name: z.string().nonempty("Name is required"),
  email: z.string().nonempty("Email is required").email("Invalid email"),
  notes: z.string().optional(),
});

export default function DragonfireQuoteSidebarPanel() {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const placedPositions = useDragNDropStore((s) => s.placedPositions);
  const selectedPlacedIndex = useDragNDropStore((s) => s.selectedPlacedIndex);
  const activeSceneItem = useDragNDropStore((s) => s.activeSceneItem);
  const measurementUnits = useAnimationStore((s) => s.measurementUnits);
  const unitSystem = useAnimationStore((s) => s.unitSystem);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      notes: "",
    },
  });

  const onSubmit = async (formData) => {
    setSuccessMessage("");
    setErrorMessage("");
    setLoading(true);

    let didCleanForExport = false;
    let prevShowDimensionLines = undefined;
    let didHideNavCubeForExport = false;
    let prevFloorDragEnabled = undefined;
    let prevWallDragEnabled = undefined;

    try {
      didCleanForExport = selectedPlacedIndex != null || activeSceneItem != null;
      prevShowDimensionLines = useAnimationStore.getState().showDimensionLines;

      // Hard-disable interactions during screenshot/PDF generation.
      const dragState = useDragNDropStore.getState();
      prevFloorDragEnabled = dragState.isFloorDragEnabled;
      prevWallDragEnabled = dragState.isWallDragEnabled;
      useDragNDropStore.setState({
        isFloorDragEnabled: false,
        isWallDragEnabled: false,
        isCanvasPointerDown: false,
        isCanvasPointerUp: false,
        isCanvasPointerMoving: false,
        pointerMoveTimestamp: null,
      });

      // Always hide overlays for clean exports.
      useAnimationStore.setState({ showDimensionLines: false });
      window.dispatchEvent(
        new CustomEvent("dragonfire-tools-set-navcube-leftoffset", {
          detail: { leftOffset: 10000 },
        }),
      );
      didHideNavCubeForExport = true;

      // If user had an object selected, clear selection overlays too.
      if (didCleanForExport) {
        useDragNDropStore.setState({
          selectedPlacedIndex: null,
          activeSceneItem: null,
          selectedObject: null,
        });
      }

      const captureFrame = async () => {
        const requestId = makeRequestId();
        return new Promise((resolve, reject) => {
          const timeout = window.setTimeout(() => {
            window.removeEventListener("dragonfire-tools-capture-frame-response", onResponse);
            reject(new Error("Screenshot capture timed out"));
          }, 8000);

          const onResponse = (e) => {
            const detail = e?.detail ?? {};
            if (detail.requestId !== requestId) return;
            window.clearTimeout(timeout);
            window.removeEventListener(
              "dragonfire-tools-capture-frame-response",
              onResponse,
            );
            resolve(detail.dataUrl ?? null);
          };

          window.addEventListener(
            "dragonfire-tools-capture-frame-response",
            onResponse,
          );

          window.dispatchEvent(
            new CustomEvent("dragonfire-tools-capture-frame", {
              detail: { requestId },
            }),
          );
        });
      };

      // Capture a small set of cinematic, room-level screenshots only.
      // These camera orientations are driven by NavCube's `CameraAnimations`
      // via `navCubeMeshNameSelect` in `useAnimationStore`.
      const captureRoomShot = async ({
        navCubeKey,
        label,
        orbitRadius,
        waitMs,
      }) => {
        if (orbitRadius != null) {
          window.dispatchEvent(
            new CustomEvent("dragonfire-tools-set-navcube-orbit-radius", {
              detail: { orbitRadius },
            }),
          );
        }

        useAnimationStore.setState({ navCubeMeshNameSelect: navCubeKey });
        // eslint-disable-next-line no-await-in-loop
        await sleep(waitMs);
        window.dispatchEvent(
          new CustomEvent("dragonfire-tools-quote-facing-filter-apply"),
        );
        // eslint-disable-next-line no-await-in-loop
        await sleep(80);
        let dataUrl = null;
        try {
          // eslint-disable-next-line no-await-in-loop
          dataUrl = await captureFrame();
        } finally {
          window.dispatchEvent(
            new CustomEvent("dragonfire-tools-quote-facing-filter-reset"),
          );
        }
        return { label, dataUrl };
      };

      // Ensure we start from a clean centered target.
      window.dispatchEvent(
        new CustomEvent("dragonfire-tools-set-controls-target", {
          detail: { target: [0, 1.25, 0] },
        }),
      );

      const roomShots = [];
      for (const shot of DRAGONFIRE_QUOTE_UPPER_CORNER_SHOTS) {
        // eslint-disable-next-line no-await-in-loop
        roomShots.push(
          await captureRoomShot({
            navCubeKey: shot.navCubeKey,
            label: shot.label,
            orbitRadius: getDragonfireQuoteScreenshotOrbitDistance(),
            waitMs: DRAGONFIRE_QUOTE_SCREENSHOT_SETTLE_MS,
          }),
        );
      }
      // eslint-disable-next-line no-await-in-loop
      roomShots.push(
        await captureRoomShot({
          navCubeKey: "top",
          label: "Top view",
          orbitRadius: getDragonfireQuoteTopViewOrbitDistance(),
          waitMs: DRAGONFIRE_QUOTE_SCREENSHOT_SETTLE_MS,
        }),
      );

      // Reset nav-cube orbit radius after captures.
      window.dispatchEvent(new CustomEvent("dragonfire-tools-reset-navcube-orbit-radius", {}));

      const cabinetLines = aggregateCabinetLines(placedPositions);

      const blob = await generateDragonfireQuotePDF({
        customerName: formData.name,
        customerEmail: formData.email,
        notes: formData.notes,
        measurementUnits: measurementUnits ?? "in",
        unitSystem: unitSystem ?? "imperial",
        roomShots,
        cabinetLines,
      });

      triggerDragonfireQuotePdfDownload(blob);

      try {
        await sendDragonfireQuoteEmail({ form: formData, pdfBlob: blob });
        setSuccessMessage(
          "Quote PDF downloaded and a copy was sent to your email.",
        );
      } catch (emailErr) {
        setSuccessMessage("Quote PDF downloaded.");
        setErrorMessage(
          emailErr instanceof Error && emailErr.message
            ? emailErr.message
            : "We could not email the quote. Try again later.",
        );
        // eslint-disable-next-line no-console
        console.error("Dragonfire quote email error:", emailErr);
      }

      reset();
    } catch (err) {
      setErrorMessage("Failed to generate quote PDF.");
      // eslint-disable-next-line no-console
      console.error("Dragonfire quote PDF error:", err);
    } finally {
      // Restore overlays visibility regardless of user selection state.
      useAnimationStore.setState({ showDimensionLines: prevShowDimensionLines });
      if (didHideNavCubeForExport) {
        window.dispatchEvent(
          new CustomEvent("dragonfire-tools-reset-navcube-leftoffset", {}),
        );
      }

      // Restore interaction flags.
      useDragNDropStore.setState({
        isFloorDragEnabled: prevFloorDragEnabled ?? false,
        isWallDragEnabled: prevWallDragEnabled ?? false,
      });

      setLoading(false);
    }
  };

  return (
    <div className={styles.panel}>
      {loading && (
        <div className={styles.generatingOverlay} aria-hidden="true">
          <div className={styles.generatingCard}>
            <div className={styles.generatingTitle}>Generating quote…</div>
            <div className={styles.generatingSubtitle}>
              Please wait while we capture the room and generate your PDF.
            </div>
          </div>
        </div>
      )}
      <div className={styles.header}>
        <div className={styles.title}>Request Quote</div>
        <div className={styles.subtitle}>
          Enter your details to generate a PDF quote for your current
          configuration.
        </div>
      </div>

      {successMessage && (
        <div className={styles.successMessage}>{successMessage}</div>
      )}
      {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
        <input
          {...register("name")}
          className={styles.input}
          type="text"
          placeholder="Name"
          disabled={loading}
        />
        {errors.name && <p className={styles.errorText}>{errors.name.message}</p>}

        <input
          {...register("email")}
          className={styles.input}
          type="email"
          placeholder="Email"
          disabled={loading}
        />
        {errors.email && (
          <p className={styles.errorText}>{errors.email.message}</p>
        )}

        <textarea
          {...register("notes")}
          className={styles.textarea}
          placeholder="Notes (optional)"
          disabled={loading}
        />

        <button
          className={styles.downloadButton}
          type="submit"
          disabled={loading}
        >
          {loading ? "GENERATING..." : "SUBMIT & DOWNLOAD QUOTE"}
        </button>
      </form>
    </div>
  );
}

