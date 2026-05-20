import { join } from "path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import QRCode from "qrcode";

export type CertificateRenderInput = {
  fullName: string;
  courseName: string;
  certificateNumber: string;
  verifyUrl: string;
};

/**
 * Positions are normalized fractions of the template size (W x H).
 * They are tuned against `public/certificate-template.png` (1024x683).
 * Tweak these constants if the template art is updated.
 */
const POS = {
  // Recipient name (italic serif) sits in the empty band between
  // "THIS IS TO CERTIFY THAT" and the decorative gold divider.
  nameY: 0.515,
  nameMaxWidth: 0.62,
  nameStartFrac: 0.062,
  nameMinPx: 18,

  // Course / profession (uppercase bold) sits on the underline below
  // "...HAS SUCCESSFULLY COMPLETED THE SKILL ASSESSMENT IN".
  courseY: 0.658,
  courseMaxWidth: 0.60,
  courseStartFrac: 0.024,
  courseMinPx: 12,

  // QR target: exactly fills the dashed square placeholder.
  // Probed dashed bounds: x:0.080..0.207, y:0.615..0.815.
  qrXFrac: 0.080,
  qrYFrac: 0.615,
  qrSizeFrac: 0.127,

  // Certificate ID lives inside the "Enter Certificate ID" input box.
  // Probed interior bounds: x:0.058..0.234, y:0.862..0.914.
  idBoxXFrac: 0.058,
  idBoxYFrac: 0.862,
  idBoxWFrac: 0.176,
  idBoxHFrac: 0.052,
  idSizeFrac: 0.0165,
} as const;

const NAVY = "#0f1e44";

/** Draw certificate using `public/certificate-template.png` + dynamic fields. */
export async function renderCertificatePng(input: CertificateRenderInput): Promise<Buffer> {
  const templatePath = join(process.cwd(), "public", "certificate-template.png");
  const bg = await loadImage(templatePath);
  const W = bg.width;
  const H = bg.height;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bg, 0, 0, W, H);

  // Recipient name (italic serif, centered in the empty band).
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = NAVY;
  drawFittedCenterText(
    ctx,
    input.fullName,
    W / 2,
    H * POS.nameY,
    W * POS.nameMaxWidth,
    Math.floor(W * POS.nameStartFrac),
    (size) => `italic 600 ${size}px Georgia, "Times New Roman", serif`,
    POS.nameMinPx,
  );

  // Course / profession (uppercase bold, sits on the underline).
  ctx.fillStyle = NAVY;
  drawFittedCenterText(
    ctx,
    input.courseName.toUpperCase(),
    W / 2,
    H * POS.courseY,
    W * POS.courseMaxWidth,
    Math.floor(W * POS.courseStartFrac),
    (size) => `700 ${size}px Arial, Helvetica, sans-serif`,
    POS.courseMinPx,
  );

  // Certificate ID — paint a tiny "ink-out" rect using the input field's
  // ACTUAL interior color sampled from the template, sized to just the
  // placeholder glyphs. This hides the baked-in "Enter Certificate ID"
  // text without creating a visible white box.
  const idBoxX = Math.floor(W * POS.idBoxXFrac);
  const idBoxY = Math.floor(H * POS.idBoxYFrac);
  const idBoxW = Math.floor(W * POS.idBoxWFrac);
  const idBoxH = Math.floor(H * POS.idBoxHFrac);
  const idFontSize = Math.max(12, Math.floor(W * POS.idSizeFrac));
  const idCenterX = idBoxX + idBoxW / 2;
  const idCenterY = idBoxY + idBoxH / 2;

  // Sample the field interior color a few px above/below the placeholder
  // text band; that area is uniform input-field background.
  const fieldBg = sampleAverageColor(ctx, [
    [idCenterX, idBoxY + 4],
    [idCenterX, idBoxY + idBoxH - 4],
    [idBoxX + 6, idCenterY],
    [idBoxX + idBoxW - 6, idCenterY],
  ]);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${idFontSize}px "Courier New", monospace`;

  const certIdMetrics = ctx.measureText(input.certificateNumber);
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
  ctx.fillText(input.certificateNumber, idCenterX, idCenterY);

  // QR code: drawn directly inside the dashed placeholder box. The QR's
  // own white modules act as its quiet zone — no extra wipe rectangle.
  const qrSize = Math.floor(W * POS.qrSizeFrac);
  const qrX = Math.floor(W * POS.qrXFrac);
  const qrY = Math.floor(H * POS.qrYFrac);

  const qrDataUrl = await QRCode.toDataURL(input.verifyUrl, {
    width: qrSize * 3,
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

function sampleAverageColor(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  points: ReadonlyArray<readonly [number, number]>,
): string {
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
}
