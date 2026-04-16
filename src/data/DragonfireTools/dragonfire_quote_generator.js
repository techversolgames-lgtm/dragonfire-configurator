import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function dataUrlToUint8Array(dataUrl) {
  const base64 = String(dataUrl).split(",")[1] ?? "";
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Downscale and JPEG-encode room shots so the PDF stays small enough to POST to Vercel
 * (serverless request bodies are capped at ~4.5MB including JSON + base64).
 */
async function shotDataUrlToJpegBytes(dataUrl, maxEdgePx, jpegQuality) {
  if (typeof document === "undefined") return null;
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error("shot decode failed"));
      img.src = dataUrl;
    });
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return null;
    const scale = Math.min(1, maxEdgePx / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));
    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, tw, th);
    const jpegDataUrl = canvas.toDataURL("image/jpeg", jpegQuality);
    return dataUrlToUint8Array(jpegDataUrl);
  } catch {
    return null;
  }
}

function drawCenteredTitle({ page, text, pageWidth, y, font, fontBold }) {
  page.drawText(text, {
    x: (pageWidth - font.widthOfTextAtSize(text, 16)) / 2,
    y,
    size: 16,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
}

function drawImageWithAspect({ page, image, pageWidth, pageHeight, yTop, margin }) {
  // Fit image within [pageWidth - 2*margin] x [pageHeight] area, respecting aspect ratio.
  const targetWidth = pageWidth - margin * 2;
  const aspect = image.height / image.width;
  const targetHeight = targetWidth * aspect;

  const maxHeight = yTop - margin; // top start down to bottom margin
  const finalHeight = targetHeight > maxHeight ? maxHeight : targetHeight;
  const finalWidth = finalHeight / aspect;

  const x = (pageWidth - finalWidth) / 2;
  const y = yTop - finalHeight;

  page.drawImage(image, {
    x,
    y,
    width: finalWidth,
    height: finalHeight,
  });

  return { x, y, width: finalWidth, height: finalHeight };
}

async function tryEmbedLogo(pdfDoc) {
  try {
    const response = await fetch("/logos/Dragon%20Fire%20UI%20Logo.png");
    if (!response.ok) return null;
    const bytes = await response.arrayBuffer();
    return pdfDoc.embedPng(bytes);
  } catch (e) {
    return null;
  }
}

function drawHeaderLogo({ page, logoImage, pageWidth, pageHeight, margin }) {
  if (!logoImage) return pageHeight - 62;
  const maxW = 180;
  const maxH = 56;
  const scale = Math.min(maxW / logoImage.width, maxH / logoImage.height);
  const width = logoImage.width * scale;
  const height = logoImage.height * scale;
  const x = (pageWidth - width) / 2;
  const y = pageHeight - margin - height + 12;
  page.drawImage(logoImage, { x, y, width, height });
  return y - 24;
}

function formatTableCell(value) {
  if (value === null || value === undefined) return "—";
  return String(value);
}

function drawFittedText({
  page,
  text,
  x,
  y,
  maxWidth,
  font,
  color,
  maxSize = 11,
  minSize = 8,
  /** When true, `y` is the text baseline (stable vertical alignment). */
  baseline = false,
}) {
  const safeText = formatTableCell(text);
  let size = maxSize;
  while (size > minSize && font.widthOfTextAtSize(safeText, size) > maxWidth) {
    size -= 0.5;
  }
  const drawY = baseline ? y : y + (maxSize - size) * 0.5;
  page.drawText(safeText, {
    x,
    y: drawY,
    size,
    font,
    color,
  });
}

function drawCabinetNameCell({
  page,
  text,
  x,
  rowTop,
  rowBottom,
  maxWidth,
  font,
  color,
}) {
  const raw = text == null ? "—" : String(text);
  const parts = raw.split("\n").map((p) => p.trim()).filter(Boolean);
  const yMid = (rowTop + rowBottom) / 2;
  if (parts.length >= 2) {
    const lineGap = 11;
    const upperBaseline = yMid + lineGap / 2 - 1;
    const lowerBaseline = yMid - lineGap / 2 - 1;
    drawFittedText({
      page,
      text: parts[0],
      x,
      y: upperBaseline,
      maxWidth,
      font,
      color,
      maxSize: 10,
      minSize: 8,
      baseline: true,
    });
    drawFittedText({
      page,
      text: parts.slice(1).join(" "),
      x,
      y: lowerBaseline,
      maxWidth,
      font,
      color,
      maxSize: 10,
      minSize: 8,
      baseline: true,
    });
  } else {
    drawFittedText({
      page,
      text: parts[0] ?? "—",
      x,
      y: yMid - 3.6,
      maxWidth,
      font,
      color,
      maxSize: 11,
      minSize: 8.5,
      baseline: true,
    });
  }
}

export async function generateDragonfireQuotePDF({
  customerName,
  customerEmail,
  notes,
  measurementUnits,
  unitSystem,
  roomShots,
  cabinetLines,
}) {
  const pdfDoc = await PDFDocument.create();

  const pageWidth = 595.28; // A4 in points
  const pageHeight = 841.89;
  const margin = 48;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const logoImage = await tryEmbedLogo(pdfDoc);

  // ---- Cover page ----
  const cover = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = drawHeaderLogo({
    page: cover,
    logoImage,
    pageWidth,
    pageHeight,
    margin,
  });

  cover.drawText("Dragon Fire Quote", {
    x: margin,
    y,
    size: 20,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 26;

  cover.drawText(`Units: ${unitSystem ?? "imperial"} (${measurementUnits ?? "in"})`, {
    x: margin,
    y,
    size: 12,
    font,
    color: rgb(0, 0, 0),
  });
  y -= 16;

  if (customerName) {
    cover.drawText(`Customer: ${customerName}`, {
      x: margin,
      y,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });
    y -= 16;
  }

  if (customerEmail) {
    cover.drawText(`Email: ${customerEmail}`, {
      x: margin,
      y,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });
    y -= 16;
  }

  if (notes) {
    // keep simple: single-line notes (PDF tables were removed; can enhance later)
    const noteText = String(notes).slice(0, 140);
    cover.drawText(`Notes: ${noteText}`, {
      x: margin,
      y,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });
    y -= 16;
  }

  y -= 10;
  const shotsCount = Array.isArray(roomShots) ? roomShots.length : 0;
  cover.drawText(`Room shots: ${shotsCount}`, {
    x: margin,
    y,
    size: 12,
    fontBold,
    color: rgb(0, 0, 0),
  });
  y -= 16;

  const now = new Date();
  cover.drawText(
    `Date: ${now.toLocaleDateString()} ${now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`,
    {
      x: margin,
      y,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    },
  );

  // ---- Room shot pages ----
  for (const shot of roomShots ?? []) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const top = drawHeaderLogo({
      page,
      logoImage,
      pageWidth,
      pageHeight,
      margin,
    });

    page.drawText(shot?.label ? shot.label : "Room", {
      x: margin,
      y: top,
      size: 16,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    if (shot?.dataUrl) {
      const jpegBytes = await shotDataUrlToJpegBytes(shot.dataUrl, 1120, 0.78);
      let image;
      if (jpegBytes?.length) {
        image = await pdfDoc.embedJpg(jpegBytes);
      } else {
        const bytes = dataUrlToUint8Array(shot.dataUrl);
        image = await pdfDoc.embedPng(bytes);
      }
      drawImageWithAspect({
        page,
        image,
        pageWidth,
        pageHeight,
        yTop: top - 10,
        margin,
      });
    } else {
      page.drawText("Screenshot not available.", {
        x: margin,
        y: top - 30,
        size: 12,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
    }
  }

  // ---- Cabinet summary table ----
  const lines = Array.isArray(cabinetLines) ? cabinetLines : [];
  const tablePage = pdfDoc.addPage([pageWidth, pageHeight]);
  const tableTop = drawHeaderLogo({
    page: tablePage,
    logoImage,
    pageWidth,
    pageHeight,
    margin,
  });
  const rowHeightSingle = 24;
  const rowHeightMulti = 32;
  const headerHeight = 28;
  const tableX = margin;
  const tableW = pageWidth - margin * 2;
  const qtyColW = 56;
  const backsplashColW = 84;
  const drawerColW = 98;
  const baseColW = 122;
  const nameColW = tableW - (qtyColW + backsplashColW + drawerColW + baseColW);
  const xName = tableX;
  const xQty = xName + nameColW;
  const xBacksplash = xQty + qtyColW;
  const xDrawer = xBacksplash + backsplashColW;
  const xBase = xDrawer + drawerColW;

  tablePage.drawText("Cabinet summary", {
    x: tableX,
    y: tableTop + 10,
    size: 18,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  const headerTopY = tableTop;
  const headerBottomY = tableTop - headerHeight;
  const headerMidY = (headerTopY + headerBottomY) / 2;
  const headerTextBaseline = headerMidY - 4;

  // Header background
  tablePage.drawRectangle({
    x: tableX,
    y: headerBottomY,
    width: tableW,
    height: headerHeight,
    color: rgb(0.96, 0.96, 0.96),
    borderColor: rgb(0.85, 0.85, 0.85),
    borderWidth: 0,
  });

  const cellPadL = 8;

  const avgRow = (rowHeightSingle + rowHeightMulti) / 2;
  const maxRows = Math.floor((headerBottomY - 64) / avgRow);

  const safeLines =
    lines.length > 0
      ? lines
      : [
          {
            cabinetName: "—",
            quantity: 0,
            backsplash: null,
            drawerColor: "—",
            base: null,
          },
        ];

  const rowsToDraw = Math.min(safeLines.length, maxRows);
  const rowHeights = [];
  for (let i = 0; i < rowsToDraw; i++) {
    const line = safeLines[i] ?? {};
    rowHeights.push(
      String(line.cabinetName ?? "").includes("\n") ? rowHeightMulti : rowHeightSingle,
    );
  }
  const bodyBottomY =
    rowsToDraw === 0
      ? headerBottomY
      : headerBottomY - rowHeights.reduce((sum, h) => sum + h, 0);

  const gridColor = rgb(0.85, 0.85, 0.85);
  const rowSepColor = rgb(0.88, 0.88, 0.88);
  const verticalXs = [tableX, xQty, xBacksplash, xDrawer, xBase, tableX + tableW];

  // Draw grid first so rules sit behind text (no broken or overpainted strokes).
  verticalXs.forEach((xv) => {
    tablePage.drawLine({
      start: { x: xv, y: headerTopY },
      end: { x: xv, y: bodyBottomY },
      thickness: 0.5,
      color: gridColor,
    });
  });
  tablePage.drawLine({
    start: { x: tableX, y: headerTopY },
    end: { x: tableX + tableW, y: headerTopY },
    thickness: 0.5,
    color: gridColor,
  });
  tablePage.drawLine({
    start: { x: tableX, y: headerBottomY },
    end: { x: tableX + tableW, y: headerBottomY },
    thickness: 0.5,
    color: gridColor,
  });
  let ySep = headerBottomY;
  for (let i = 0; i < rowsToDraw; i++) {
    ySep -= rowHeights[i];
    tablePage.drawLine({
      start: { x: tableX, y: ySep },
      end: { x: tableX + tableW, y: ySep },
      thickness: 0.5,
      color: rowSepColor,
    });
  }

  tablePage.drawText("Cabinet", {
    x: xName + cellPadL,
    y: headerTextBaseline,
    size: 12,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  const qtyHeader = "Qty";
  const qtyHeaderW = fontBold.widthOfTextAtSize(qtyHeader, 12);
  tablePage.drawText(qtyHeader, {
    x: xQty + (qtyColW - qtyHeaderW) / 2,
    y: headerTextBaseline,
    size: 12,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  tablePage.drawText("Backsplash", {
    x: xBacksplash + cellPadL,
    y: headerTextBaseline,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  tablePage.drawText("Drawer Color", {
    x: xDrawer + cellPadL,
    y: headerTextBaseline,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  tablePage.drawText("Base", {
    x: xBase + cellPadL,
    y: headerTextBaseline,
    size: 12,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  let rowTopY = headerBottomY;
  for (let i = 0; i < rowsToDraw; i++) {
    const line = safeLines[i] ?? {};
    const rowHeight = rowHeights[i];
    const rowBottomY = rowTopY - rowHeight;

    const yMid = (rowTopY + rowBottomY) / 2;
    const textBaseline = yMid - 3.6;

    drawCabinetNameCell({
      page: tablePage,
      text: line.cabinetName ?? "—",
      x: xName + cellPadL,
      rowTop: rowTopY,
      rowBottom: rowBottomY,
      maxWidth: nameColW - cellPadL * 2,
      font,
      color: rgb(0, 0, 0),
    });

    const qtyStr = String(line.quantity ?? 0);
    let qtySize = 11;
    while (
      qtySize > 8 &&
      fontBold.widthOfTextAtSize(qtyStr, qtySize) > qtyColW - cellPadL * 2
    ) {
      qtySize -= 0.5;
    }
    const qtyW = fontBold.widthOfTextAtSize(qtyStr, qtySize);
    tablePage.drawText(qtyStr, {
      x: xQty + (qtyColW - qtyW) / 2,
      y: textBaseline - (11 - qtySize) * 0.35,
      size: qtySize,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    drawFittedText({
      page: tablePage,
      text: formatTableCell(line.backsplash),
      x: xBacksplash + cellPadL,
      y: textBaseline,
      maxWidth: backsplashColW - cellPadL * 2,
      font,
      color: rgb(0, 0, 0),
      maxSize: 11,
      minSize: 8.5,
      baseline: true,
    });
    drawFittedText({
      page: tablePage,
      text: formatTableCell(line.drawerColor),
      x: xDrawer + cellPadL,
      y: textBaseline,
      maxWidth: drawerColW - cellPadL * 2,
      font,
      color: rgb(0, 0, 0),
      maxSize: 11,
      minSize: 8.5,
      baseline: true,
    });
    drawFittedText({
      page: tablePage,
      text: formatTableCell(line.base),
      x: xBase + cellPadL,
      y: textBaseline,
      maxWidth: baseColW - cellPadL * 2,
      font,
      color: rgb(0, 0, 0),
      maxSize: 11,
      minSize: 8,
      baseline: true,
    });

    rowTopY = rowBottomY;
  }

  if (safeLines.length > maxRows) {
    tablePage.drawText(`+ ${safeLines.length - maxRows} more item(s) not shown due to page limits.`, {
      x: tableX + 10,
      y: 60,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}

