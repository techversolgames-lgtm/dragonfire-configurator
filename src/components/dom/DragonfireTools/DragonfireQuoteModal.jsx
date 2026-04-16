import { useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import styles from "@/styles/dom/DragonfireTools/DragonfireQuoteModal.module.scss";
import { generateDragonfireQuotePDF } from "@/data/DragonfireTools/dragonfire_quote_generator";
import { aggregateCabinetLines } from "@/data/DragonfireTools/dragonfire_quote_lines";
import {
  sendDragonfireQuoteEmail,
  triggerDragonfireQuotePdfDownload,
} from "@/data/DragonfireTools/send_dragonfire_quote_email";

const schema = z.object({
  name: z.string().nonempty("Name is required"),
  email: z.string().nonempty("Email is required").email("Invalid email"),
  notes: z.string().optional(),
});

export default function DragonfireQuoteModal({ open, onClose, quoteContext }) {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: useMemo(
      () => ({
        name: "",
        email: "",
        notes: "",
      }),
      [],
    ),
  });

  const onSubmit = async (formData) => {
    setSuccessMessage("");
    setErrorMessage("");
    setLoading(true);

    try {
      const placed = quoteContext?.placedPositions ?? [];
      const cabinetLines = aggregateCabinetLines(placed);
      const blob = await generateDragonfireQuotePDF({
        customerName: formData.name,
        customerEmail: formData.email,
        notes: formData.notes,
        measurementUnits: quoteContext?.measurementUnits ?? "in",
        unitSystem: quoteContext?.unitSystem ?? "imperial",
        roomShots: [],
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
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalContent}>
        <button
          type="button"
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close"
        >
          ×
        </button>

        <h2 className={styles.title}>Request Quote</h2>
        <p className={styles.subtitle}>
          Enter your details and we will generate a quote PDF for your current
          Dragon Fire configuration.
        </p>

        {successMessage && (
          <div className={styles.successMessage}>{successMessage}</div>
        )}
        {errorMessage && (
          <div className={styles.errorMessage}>{errorMessage}</div>
        )}

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          <input
            {...register("name")}
            className={styles.input}
            type="text"
            placeholder="Name"
          />
          {errors.name && (
            <p className={styles.errorText}>{errors.name.message}</p>
          )}

          <input
            {...register("email")}
            className={styles.input}
            type="email"
            placeholder="Email"
          />
          {errors.email && (
            <p className={styles.errorText}>{errors.email.message}</p>
          )}

          <textarea
            {...register("notes")}
            className={styles.textarea}
            placeholder="Notes (optional)"
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
    </div>
  );
}

