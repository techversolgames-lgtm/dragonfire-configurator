import { useEffect, useRef } from "react";
import useDragNDropStore from "@/stores/useDragNDropStore";
import { isGatedInteraction } from "@/data/DragonfireTools/dragonfireTutorialSteps";
import { useDragonfireTutorial } from "./DragonfireTutorialContext";

const NAV_DIST_MIN = 0.22;

function dist3(a, b) {
  if (!a || !b) return 0;
  const ax = a.x ?? 0;
  const ay = a.y ?? 0;
  const az = a.z ?? 0;
  const bx = b.x ?? 0;
  const by = b.y ?? 0;
  const bz = b.z ?? 0;
  const dx = ax - bx;
  const dy = ay - by;
  const dz = az - bz;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function serializeNormals(placedPositions) {
  if (!Array.isArray(placedPositions)) return "";
  return placedPositions
    .map((p) => {
      const n = p?.dragPointNormal;
      if (!n) return "0,0,0";
      return `${n.x?.toFixed(4) ?? 0},${n.y?.toFixed(4) ?? 0},${n.z?.toFixed(4) ?? 0}`;
    })
    .join("|");
}

/**
 * Subscribes to drag/camera store and sets tutorial `interactionSatisfied` when the
 * current step's real-world action is detected. No UI.
 */
export default function DragonfireTutorialInteractionBridge() {
  const {
    visible,
    currentStep,
    stepIndex,
    setInteractionSatisfied,
  } = useDragonfireTutorial();

  const placedPositions = useDragNDropStore((s) => s.placedPositions);
  const selectedPlacedIndex = useDragNDropStore(
    (s) => s.selectedPlacedIndex ?? null,
  );
  const cameraPosition = useDragNDropStore((s) => s.cameraPosition);
  /** Bumps when CameraControls updates; needed because camera position may reuse the same Vector3 ref. */
  const cameraTicker = useDragNDropStore((s) => s.cameraTicker);

  const baselineNav = useRef(null);
  const baselinePlaceCount = useRef(null);
  const baselineSelect = useRef(undefined);
  const baselineRotateSig = useRef(null);
  const baselineRotateLen = useRef(null);
  const baselineDeleteCount = useRef(null);
  const navInitTimer = useRef(null);
  const rotateInitTimer = useRef(null);

  const interaction = currentStep?.interaction;

  // Reset baselines when the visible step changes
  useEffect(() => {
    if (!visible || !currentStep) return;

    baselineNav.current = null;
    baselinePlaceCount.current = null;
    baselineSelect.current = undefined;
    baselineRotateSig.current = null;
    baselineDeleteCount.current = null;

    if (navInitTimer.current) {
      clearTimeout(navInitTimer.current);
      navInitTimer.current = null;
    }
    if (rotateInitTimer.current) {
      clearTimeout(rotateInitTimer.current);
      rotateInitTimer.current = null;
    }

    if (!isGatedInteraction(interaction)) {
      setInteractionSatisfied(true);
      return;
    }

    setInteractionSatisfied(false);

    const state = useDragNDropStore.getState();

    if (interaction === "navigate") {
      navInitTimer.current = setTimeout(() => {
        const cam = useDragNDropStore.getState().cameraPosition;
        if (cam && typeof cam.x === "number") {
          baselineNav.current = { x: cam.x, y: cam.y, z: cam.z };
        }
        navInitTimer.current = null;
      }, 280);
      return () => {
        if (navInitTimer.current) clearTimeout(navInitTimer.current);
      };
    }

    if (interaction === "place") {
      baselinePlaceCount.current = state.placedPositions?.length ?? 0;
    }
    if (interaction === "select") {
      baselineSelect.current = state.selectedPlacedIndex ?? null;
    }
    if (interaction === "rotate") {
      baselineRotateSig.current = null;
      baselineRotateLen.current = null;
      rotateInitTimer.current = setTimeout(() => {
        const pp = useDragNDropStore.getState().placedPositions ?? [];
        baselineRotateSig.current = serializeNormals(pp);
        baselineRotateLen.current = pp.length;
        rotateInitTimer.current = null;
      }, 450);
      return () => {
        if (rotateInitTimer.current) clearTimeout(rotateInitTimer.current);
      };
    }
    if (interaction === "delete") {
      baselineDeleteCount.current = state.placedPositions?.length ?? 0;
    }

    return undefined;
  }, [visible, currentStep, stepIndex, interaction, setInteractionSatisfied]);

  // Evaluate satisfaction whenever scene state updates
  useEffect(() => {
    if (!visible || !currentStep || !isGatedInteraction(interaction)) return;

    if (interaction === "navigate") {
      if (!baselineNav.current) return;
      const cam =
        useDragNDropStore.getState().cameraPosition ?? cameraPosition;
      if (!cam || typeof cam.x !== "number") return;
      const d = dist3(cam, baselineNav.current);
      setInteractionSatisfied(d >= NAV_DIST_MIN);
      return;
    }

    if (interaction === "place") {
      const base = baselinePlaceCount.current;
      if (base == null) return;
      const n = placedPositions?.length ?? 0;
      setInteractionSatisfied(n > base);
      return;
    }

    if (interaction === "select") {
      const sel = selectedPlacedIndex;
      const base = baselineSelect.current;
      if (base != null) {
        setInteractionSatisfied(true);
        return;
      }
      setInteractionSatisfied(sel != null);
      return;
    }

    if (interaction === "rotate") {
      let baseSig = baselineRotateSig.current;
      let baseLen = baselineRotateLen.current;
      if (baseSig == null || baseLen == null) return;
      const now = serializeNormals(placedPositions);
      const len = placedPositions?.length ?? 0;
      if (baseLen === 0 && len > 0) {
        baselineRotateSig.current = now;
        baselineRotateLen.current = len;
        setInteractionSatisfied(false);
        return;
      }
      baseSig = baselineRotateSig.current;
      baseLen = baselineRotateLen.current;
      if (len !== baseLen) {
        setInteractionSatisfied(false);
        return;
      }
      setInteractionSatisfied(now !== baseSig);
      return;
    }

    if (interaction === "delete") {
      const base = baselineDeleteCount.current;
      if (base == null) return;
      const n = placedPositions?.length ?? 0;
      setInteractionSatisfied(n < base);
    }
  }, [
    visible,
    currentStep,
    interaction,
    placedPositions,
    selectedPlacedIndex,
    cameraPosition,
    cameraTicker,
    setInteractionSatisfied,
  ]);

  return null;
}
