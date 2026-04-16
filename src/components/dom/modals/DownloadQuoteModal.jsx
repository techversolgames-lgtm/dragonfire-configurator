import React, { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import styles from "@/styles/dom/modals/DownloadQuoteModal.module.scss";
import useAnimationStore from "@/stores/useAnimationStore";
// import { generateStorlocQuotePDF } from "@/utils/pdf/storloc_quote_generator";
// import { layoutPdfDescriptions } from "@/components/canvas/Storloc/Cabinet/utils/conversions";

const schema = z.object({
  name: z.string().nonempty("Name is required"),
  email: z.string().nonempty("Name is required").email("Invalid email"),
});

export default function DownloadQuoteModal({
  open,
  configuration,
  onClose,
  price,
  onEmailSend,
}) {
  // const [form, setForm] = useState({ name: "", email: "", notes: "" });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (formData) => {
    setSuccessMessage("");
    setErrorMessage("");
    setLoading(true);

    try {
      // Get data from the store
      const {
        price: storePrice,
        cabinetColor,
        drawerColor,
        depth,
        housingHeight,
        columns,
        drawers,
        wheels,
        lightFixture,
        powerOutlets,
        isTwoLightFixtures,
        isWideLightFixture,
        top,
        riser,
      } = useAnimationStore.getState();

      // Get layoutValues separately (non-reactive)
      const layoutValues = useAnimationStore.getState().layoutValues;

      // Transform columns array into rowData format
      // Group identical columns and count their quantities
      const columnMap = new Map();

      (columns || []).forEach((column) => {
        // Split by the width specification pattern (starts with a number followed by ")
        // e.g., "Standard Wide 29 ¼" (24 ½" usable)" -> "Standard Wide" + "29 ¼" (24 ½" usable)"
        const columnWidth = column.currentValue || "";

        // Match the pattern: space followed by a digit and quote
        const match = columnWidth.match(/^(.+?)\s+(\d.*)$/);

        let columnType;
        let widthSpec;
        if (match) {
          columnType = match[1].trim(); // Everything before the width spec
          widthSpec = match[2].trim(); // The width specification
        } else {
          columnType = columnWidth;
          widthSpec = "";
        }

        // Use columnType as key to group identical columns
        if (columnMap.has(columnType)) {
          const existing = columnMap.get(columnType);
          existing.count += 1;
        } else {
          columnMap.set(columnType, {
            name: columnType,
            width: widthSpec,
            count: 1,
          });
        }
      });

      // Convert map to array with quantity format
      const rowData = Array.from(columnMap.values()).map((item) => ({
        name: item.name,
        width: item.width,
        quantity: `x${item.count}`,
      }));

      // Helper function to map layout name to image key
      const getLayoutImageKey = (layoutName) => {
        if (layoutName === "Empty") {
          return "drawerLayoutEmptyImage";
        } else if (layoutName === "Empty With Liner") {
          return "drawerLayout0Image";
        } else if (layoutName.startsWith("Layout ")) {
          // Extract the number from "Layout X"
          const layoutNumber = layoutName.replace("Layout ", "");
          return `drawerLayout${layoutNumber}Image`;
        }
        // Default fallback
        return "drawerLayoutEmptyImage";
      };

      // Transform drawers array into drawersData format
      // First, map each drawer to its data structure
      const drawerItems = (drawers || []).map((drawer) => {
        // Get drawer height (just the number part before the space)
        const drawerHeight = drawer.currentValue || "";
        const heightMatch = drawerHeight.match(/^(\d+)/);
        const height = heightMatch ? heightMatch[1] : "180";

        // Get column info from columnIndex
        const columnIndex = drawer.columnIndex ?? 0;
        const column = columns?.[columnIndex];
        const columnWidth = column?.currentValue || "";

        // Extract column type (same regex as before)
        const match = columnWidth.match(/^(.+?)\s+(\d.*)$/);
        const columnType = match ? match[1].trim() : columnWidth;

        // Build label with column type and height
        let label = `${columnType} x ${height}mm`;

        // Check if drawer is double wide
        const isDoubleWide = drawer.children?.[0]?.currentValue === true;
        if (isDoubleWide) {
          label += "\n(Double Wide)";
        }

        // Get layout info from layoutValues
        const drawerId = drawer.id;
        const layoutName = layoutValues?.[drawerId] || "Empty";

        // Map layout name to image key
        const imageKey = getLayoutImageKey(layoutName);

        // Get detailed description from layoutPdfDescriptions
        // const details = layoutPdfDescriptions[layoutName] || layoutName;

        return {
          label: label,
          image: imageKey,
          // details: details,
          details: "",
        };
      });

      // Group identical drawers and count quantities
      // Create a unique key from label + image + details
      const drawerMap = new Map();
      drawerItems.forEach((item) => {
        const uniqueKey = `${item.label}|||${item.image}|||${item.details}`;
        if (drawerMap.has(uniqueKey)) {
          drawerMap.get(uniqueKey).count += 1;
        } else {
          drawerMap.set(uniqueKey, {
            ...item,
            count: 1,
          });
        }
      });

      // Convert map to array with quantity format
      const drawersData = Array.from(drawerMap.values()).map((item) => ({
        label: item.label,
        image: item.image,
        details: item.details,
        quantity: `x${item.count}`,
      }));

      // Calculate mobile base kit configuration
      // Mobile base kit only exists if wheels are present
      let mobileBaseKeys = null;
      if (wheels) {
        // Calculate total cabinet width (sum of all column widths)
        const totalCabinetWidth = (columns || []).reduce((sum, column) => {
          const widthStr = column.currentValue || "";
          // Extract the numeric width value (e.g., "29 ¼"" -> 29.25)
          const match = widthStr.match(/(\d+)\s*(\d+\/\d+)?/);
          if (match) {
            const whole = parseInt(match[1]);
            let fraction = 0;
            if (match[2]) {
              // Parse fraction like "1/4"
              const [num, denom] = match[2].split("/").map(Number);
              fraction = num / denom;
            }
            return sum + whole + fraction;
          }
          return sum;
        }, 0);

        // Determine quantities based on width (threshold is 59.05512 inches = 1500mm)
        const isWide = totalCabinetWidth > 59.05512;

        mobileBaseKeys = [
          { key: "handlesSide", quantity: isWide ? 4 : 2 },
          { key: "swivelWheels", quantity: isWide ? 4 : 2 },
          { key: "rigidWheels", quantity: 2 }, // Always 2
        ];
      }

      // Calculate power outlet count based on riser pillar logic
      // Same logic as RiserModelTemplate.jsx L288-L340
      const cabinetWidthInches = (columns || []).reduce((sum, col) => {
        const widthMatch = (col.currentValue || "").match(
          /(\d+(?:\s*¼|½|¾)?)\s*"/
        );
        if (widthMatch) {
          const widthStr = widthMatch[1].replace(/\s/g, "");
          let width = parseFloat(widthStr);
          if (widthStr.includes("¼")) width += 0.25;
          if (widthStr.includes("½")) width += 0.5;
          if (widthStr.includes("¾")) width += 0.75;
          return sum + width;
        }
        return sum;
      }, 0);

      // Calculate number of riser pillars (same logic as the component)
      let powerOutletCount = 2; // Always start with left and right pillars
      if (cabinetWidthInches > 102) {
        powerOutletCount = 3; // Add middle-left pillar
      }
      if (cabinetWidthInches > 144) {
        powerOutletCount = 4; // Add middle-right pillar
      }

      // Build workstation accessory keys conditionally based on top configuration
      const workstationAccessoryKeys = [];

      // Check if riser is enabled (anything other than "None")
      const hasRiser = riser !== "None";

      // Handle top-related accessories based on top type
      // "None" - omit all three (worktop, pegboard, riser)
      // "Maple" - add worktop, and conditionally add pegboard/riser if hasRiser
      // "Stainless Steel Capped" - add only worktop (no pegboard/riser regardless)
      // "Stainless Steel Capped Maple" - add worktop, and conditionally add pegboard/riser if hasRiser
      if (top === "Maple") {
        workstationAccessoryKeys.push("mapleWorktop");
        if (hasRiser) {
          workstationAccessoryKeys.push("pegboard", "mapleRiser");
        }
      } else if (top === "Stainless Steel Capped") {
        workstationAccessoryKeys.push("stainlessSteelCappedWorktop");
        // No pegboard or riser for this option
      } else if (top === "Stainless Steel Capped Maple") {
        workstationAccessoryKeys.push("stainlessSteelCappedMapleWorktop");
        if (hasRiser) {
          workstationAccessoryKeys.push("pegboard", "stainlessSteelRiser");
        }
      }
      // If top === "None", don't add any of these items

      // Add lights if enabled
      if (lightFixture) {
        workstationAccessoryKeys.push("ledLights");
      }

      // Add power outlets if enabled
      if (powerOutlets) {
        workstationAccessoryKeys.push("powerOutlet");
      }

      // Generate PDF using the new PDF generator
      // const blob = await generateStorlocQuotePDF({
      //   configToken: "skb-123456789", // TODO: Generate from configuration
      //   customerName: formData.name,
      //   customerEmail: formData.email,
      //   cabinetColors: {
      //     bodyColor: cabinetColor,
      //     drawerColor: drawerColor,
      //   },
      //   housingData: {
      //     depthValue: depth,
      //     titleSuffix: "Housing (Columns)",
      //     heightValue: housingHeight,
      //     rowData: rowData,
      //     locksQuantity: `x${columns?.length || 1}`,
      //   },
      //   drawersData: drawersData,
      //   workstationAccessoryKeys: workstationAccessoryKeys,
      //   workstationAccessoryData: {
      //     lightFixtureQuantity: isTwoLightFixtures ? 2 : 1,
      //     lightFixtureWidth: isWideLightFixture ? 48 : 24,
      //     powerOutletCount: powerOutletCount,
      //     riserType: riser, // Pass riser type for description
      //   },
      //   mobileBaseKeys: mobileBaseKeys, // Calculated based on wheels and cabinet width
      //   price: storePrice, // Pass price from store
      // });

      // console.log("🚀 ~ DownloadQuoteModal.jsx ~ onSubmit ~ blob:", blob);

      // Download the PDF
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement("a");
      // a.style.display = "none";
      // a.href = url;
      // a.download = `stor-loc-quote.pdf`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // window.URL.revokeObjectURL(url);
      // setSuccessMessage("Successfully downloaded!");
      reset();

      // Send email after successful download
      // TEMPORARILY DISABLED - Working on PDF creation
      // if (onEmailSend) {
      //   // Convert blob to base64 for email attachment
      //   const reader = new FileReader();
      //   reader.readAsDataURL(blob);
      //   reader.onloadend = async () => {
      //     const base64data = reader.result;
      //     await onEmailSend({
      //       name: data.name,
      //       email: data.email,
      //       notes: data.notes,
      //       pdfData: base64data,
      //     });
      //   };
      // }
    } catch (err) {
      setErrorMessage("Failed to generate PDF");
      console.error("Error generating PDF:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

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
        <h2 className={styles.title}>Download Quote</h2>
        <p className={styles.subtitle}>
          Enter your details to download a quote for your cabinet
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
            <p className={styles.errorMessage}>{errors.name.message}</p>
          )}
          <input
            {...register("email")}
            className={styles.input}
            type="email"
            placeholder="Email"
          />
          {errors.email && (
            <p className={styles.errorMessage}>{errors.email.message}</p>
          )}
          <textarea
            {...register("notes")}
            className={styles.textarea}
            placeholder="Notes"
          />
          {errors.notes && (
            <p className={styles.errorMessage}>{errors.notes.message}</p>
          )}
          <button
            className={styles.downloadButton}
            type="submit"
            disabled={loading}
          >
            {loading ? "PROCESSING..." : "SUBMIT & DOWNLOAD QUOTE"}
          </button>
        </form>
      </div>
    </div>
  );
}
