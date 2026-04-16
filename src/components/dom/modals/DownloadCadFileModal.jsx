import React, { useState } from "react";
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import styles from "@/styles/dom/modals/DownloadCadFileModal.module.scss";
import useAnimationStore from "@/stores/useAnimationStore";


const schema = z.object({
  name:z.string().nonempty("Name is required"),
  email: z.string().nonempty("Name is required").email("Invalid email"),
  notes: z.string().optional(),
});

export default function DownloadCadFileModal({ open, onClose, configuration }) {
  // const [form, setForm] = useState({ name: "", email: "", notes: "" });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  if (!open) return null;


  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {

    setSuccessMessage("");
    setErrorMessage("");
    setLoading(true);

    const payload = {
      modelId:"63b4cc4f65be5d2b79774084",
      isFrom:"fast-configurator",
      configuration: `JSON_STRING=${configuration}`,
      filledFor: "downloadCAD",
      email: data.email,
      name: data.name,
      notes: data.notes,
    };
    try { 
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MARKETPLACE_API_URL}/post/cad-entity`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", responseType: 'blob' },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) {
        throw new Error("Failed to download file");
      }else{

        const downloadData = await response.blob();
  
        const blob = new Blob([downloadData]);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `63b4cc4f65be5d2b79774084.step`;
  
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
  
        window.URL.revokeObjectURL(url);
        setSuccessMessage("Successfully downloaded!");
        reset();
      }
      
    } catch (err) {
      setErrorMessage("Failed to download");
      console.error("Error sending to endpoint:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className={styles.title}>Download CAD File</h2>
        <p className={styles.subtitle}>
          Enter your details to download the CAD file
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
            {errors.name && <p className={styles.errorMessage}>{errors.name.message}</p>}
            <input
              {...register("email")}
              className={styles.input}
              type="email"
              placeholder="Email"
            />
            {errors.email && <p className={styles.errorMessage}>{errors.email.message}</p>}
            <textarea
              {...register("notes")}
              className={styles.textarea}
              placeholder="Notes"
            />
            {errors.notes && <p className={styles.errorMessage}>{errors.notes.message}</p>}
            <button className={styles.downloadButton} type="submit" disabled={loading} >
            {loading ? "PROCESSING..." : "SUBMIT & DOWNLOAD CAD"}

            </button>
          </form>
      </div>
    </div>
  );
}
