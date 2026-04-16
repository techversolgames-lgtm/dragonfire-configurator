import React, { useState } from "react";
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import styles from "@/styles/dom/modals/SaveConfigurationModal.module.scss";
import useAnimationStore from "@/stores/useAnimationStore";
import useIsIframe from "@/hooks/useIsIframe";


const schema = z.object({
  username:z.string().nonempty("Name is required"),
  email: z.string().nonempty("Email is required").email("Must be a valid email"),
  extraNotes: z.string().optional(),
});

export default function SaveConfigurationModal({
  open,
  onClose,
  configuration,
  price,
}) {
  
  const isIframe = useIsIframe();
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
    mode: 'onBlur',
    resolver: zodResolver(schema),
    defaultValues: {
      linkType: 'new',
      username: '',
      email: '',
      extraNotes: ''
    }
  });

  const onSubmit = async (data) => {

    console.log("🚀 ~ SaveConfigurationModal.jsx:37 ~ onSubmit ~ FormData:", FormData);

    setSuccessMessage("");
    setErrorMessage("");
    setLoading(true);

    const { latestCabinetImage, savedConfiguration } = await useAnimationStore.getState();
    const imageData = await latestCabinetImage;
    const configID = savedConfiguration && savedConfiguration != "" ?  savedConfiguration.replace("SPB-", ""): ""
    const payload = {
      baseFigure_id:"63b4cc4f65be5d2b79774084",
      configuration: `JSON_STRING=${configuration}`,
      configId: configID,
      dataImg: imageData,
      productPrice: price,
      email: data.email,
      extraNotes: data.extraNotes,
      linkType: configID ? "update" : "new",
      username: data.username,
      isNewSchema: true,
      isIframe: isIframe,
      from: "fast-configurator"
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MARKETPLACE_API_URL}/post/store-model-configuration`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const response = await res.json();

      
      if (response.success) {
        const urlConfig_id = response.savedConfiguration.urlConfig_id;

        useAnimationStore.setState((state) => {
          return {
            savedConfiguration: `SPB-${urlConfig_id}`,
          };
        })
        setSuccessMessage("Success! Your Configuration Token has been sent to your email.");
        reset();
      } else {
        setErrorMessage(response.message || "Failed to save configuration.");
        reset();
      }
    } catch (err) {
      setErrorMessage("Error sending to endpoint.");
      console.error("Error sending to endpoint:", err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        {/* X close button */}
        <button
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className={styles.title}>Save Your Configuration {process.env.MARKETPLACE_API_URL}</h2>
        <p className={styles.subtitle}>
          View it anywhere, and share it with others!
        </p>
        {successMessage && (
          <div className={styles.successMessage}>{successMessage}</div>
        )}
        {errorMessage && (
          <div className={styles.errorMessage}>{errorMessage}</div>
        )}
          <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
            <input
              {...register("username")}
              className={styles.input}
              type="text"
              placeholder="Your Name"
            />
            {errors.username && <p className={styles.errorMessage}>{errors.username.message}</p>}
            <input
              {...register("email")}
              className={styles.input}
              type="email"
              placeholder="Your Email"
            />
            {errors.email && <p className={styles.errorMessage}>{errors.email.message}</p>}
            <textarea
              {...register("extraNotes")}
              className={styles.textarea}
              placeholder="Your Notes"
            />
            {errors.extraNotes && <p className={styles.errorMessage}>{errors.extraNotes.message}</p>}
            <button type="submit" className={styles.saveButton} disabled={loading}>
              {loading ? "PROCESSING..." : "SAVE"}
            </button>
          </form>
      </div>
    </div>
  );
}
