import { createCanvas, loadImage } from "@napi-rs/canvas";
import QRCode from "qrcode";
import {
  CERT_FONTS,
  ensureCertificateFontsRegistered,
  resolveCertificateTemplatePath,
} from "@/lib/certificate-fonts";

export type CertificateRenderInput = {
  fullName: string;
  courseName: string;
  certificateNumber: string;
  verifyUrl: string;
};

/**
 * Positions are normalized fractions of the template size (W x H).
 * They are tuned against `public/certificate-template.png` (1024x683).
 */
const POS = {
  nameY: 0.515,
  nameMaxWidth: 0.62,
  nameStartFrac: 0.062,
  nameMinPx: 18,

  courseY: 0.658,
  courseMaxWidth: 0.6,
  courseStartFrac: 0.024,
  courseMinPx: 12,

  qrXFrac: 0.08,
  qrYFrac: 0.615,
  qrSizeFrac: 0.127,

  idBoxXFrac: 0.058,
  idBoxYFrac: 0.862,
  idBoxWFrac: 0.176,
  idBoxHFrac: 0.052,
  idSizeFrac: 0.0165,
} as const;

const NAVY = "#0f1e44";
/** Fallback input-field background if getImageData is unavailable on serverless. */
const ID_FIELD_BG = "#ebe4d3";

/** Draw certificate using `public/certificate-template.png` + dynamic fields. */
export async function renderCertificatePng(input: CertificateRenderInput): Promise<Buffer> {
  ensureCertificateFontsRegistered();

  const fullName = input.fullName?.trim() || "Learner";
  const courseName = input.courseName?.trim() || "Healthcare Professional";
  const certificateNumber = input.certificateNumber?.trim() || "EDK-PENDING";
  const verifyUrl = input.verifyUrl?.trim();
  if (!verifyUrl) {
    throw new Error("Certificate verifyUrl is required for QR rendering");
  }

  const templatePath = resolveCertificateTemplatePath();
  const bg = await loadImage(templatePath);
  const W = bg.width;
  const H = bg.height;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bg, 0, 0, W, H);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = NAVY;

  drawFittedCenterText(
    ctx,
    fullName,
    W / 2,
    H * POS.nameY,
    W * POS.nameMaxWidth,
    Math.floor(W * POS.nameStartFrac),
    (size) => `italic 600 ${size}px "${CERT_FONTS.name}"`,
    POS.nameMinPx,
  );

  drawFittedCenterText(
    ctx,
    courseName.toUpperCase(),
    W / 2,
    H * POS.courseY,
    W * POS.courseMaxWidth,
    Math.floor(W * POS.courseStartFrac),
    (size) => `700 ${size}px "${CERT_FONTS.course}"`,
    POS.courseMinPx,
  );

  const idBoxX = Math.floor(W * POS.idBoxXFrac);
  const idBoxY = Math.floor(H * POS.idBoxYFrac);
  const idBoxW = Math.floor(W * POS.idBoxWFrac);
  const idBoxH = Math.floor(H * POS.idBoxHFrac);
  const idFontSize = Math.max(12, Math.floor(W * POS.idSizeFrac));
  const idCenterX = idBoxX + idBoxW / 2;
  const idCenterY = idBoxY + idBoxH / 2;

  const fieldBg = sampleFieldBackground(ctx, [
    [idCenterX, idBoxY + 4],
    [idCenterX, idBoxY + idBoxH - 4],
    [idBoxX + 6, idCenterY],
    [idBoxX + idBoxW - 6, idCenterY],
  ]);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${idFontSize}px "${CERT_FONTS.id}"`;

  const certIdMetrics = ctx.measureText(certificateNumber);
  const placeholderMetrics = ctx.measureText("Enter Certificate ID");
  const wipeWidth = Math.min(
    idBoxW - 8,
    Math.ceil(Math.max(certIdMetrics.width, placeholderMetrics.width)) + 6,
  );
  const wipeHeight = Math.ceil(idFontSize * 1.05);
  ctx.fillStyle = fieldBg;
  ctx.fillRect(
    Math.floor(idCenterX - wipeWidth / 2),
    Math.floor(idCenterY - wipeHeight / 2),
    wipeWidth,
    wipeHeight,
  );

  ctx.fillStyle = NAVY;
  ctx.fillText(certificateNumber, idCenterX, idCenterY);

  const qrSize = Math.floor(W * POS.qrSizeFrac);
  const qrX = Math.floor(W * POS.qrXFrac);
  const qrY = Math.floor(H * POS.qrYFrac);

  // Clear baked-in placeholder QR art before drawing the live code.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4);

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: qrSize * 4,
    margin: 1,
    color: { dark: NAVY, light: "#ffffff" },
    errorCorrectionLevel: "H",
  });
  const qrImg = await loadImage(qrDataUrl);
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  return canvas.toBuffer("image/png");
}

function drawFittedCenterText(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  startSize: number,
  fontFor: (size: number) => string,
  minSize: number,
) {
  let size = startSize;
  ctx.font = fontFor(size);
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = fontFor(size);
  }
  ctx.fillText(text, x, y);
}

function sampleFieldBackground(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  points: ReadonlyArray<readonly [number, number]>,
): string {
  try {
    let r = 0;
    let g = 0;
    let b = 0;
    for (const [x, y] of points) {
      const px = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
      r += px[0];
      g += px[1];
      b += px[2];
    }
    const n = Math.max(1, points.length);
    return `rgb(${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`;
  } catch {
    return ID_FIELD_BG;
  }
}
