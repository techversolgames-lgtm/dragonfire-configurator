function blobToBase64Data(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unexpected file read result"));
        return;
      }
      const comma = result.indexOf(",");
      resolve(comma === -1 ? result : result.slice(comma + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error("File read failed"));
    reader.readAsDataURL(blob);
  });
}

export function triggerDragonfireQuotePdfDownload(blob, filename = "dragonfire-quote.pdf") {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * POSTs the PDF to the Next.js API route, which sends via SendGrid.
 * @param {{ name: string, email: string, notes?: string }} form
 * @param {Blob} pdfBlob
 */
export async function sendDragonfireQuoteEmail({ form, pdfBlob }) {
  const pdfBase64 = await blobToBase64Data(pdfBlob);
  const res = await fetch("/api/send-dragonfire-quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      form: {
        name: form.name,
        email: form.email,
        notes: form.notes ?? "",
      },
      pdfBase64,
    }),
  });
  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    // ignore
  }
  if (!res.ok) {
    if (res.status === 413) {
      throw new Error(
        "This quote PDF is too large to send through our server (about 4.5MB limit on the host). Download the PDF and email it yourself, or try again with fewer or smaller room shots.",
      );
    }
    const bits = [data.message || `Email request failed (${res.status})`];
    if (Array.isArray(data.missingEnv) && data.missingEnv.length) {
      bits.push(`Server reports missing: ${data.missingEnv.join("; ")}.`);
    }
    if (data.hint) bits.push(data.hint);
    throw new Error(bits.join(" "));
  }
  return data;
}
