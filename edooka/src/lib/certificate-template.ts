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

  // QR target: the dashed square on the left-middle of the template.
  qrXFrac: 0.082,
  qrYFrac: 0.615,
  qrSizeFrac: 0.135,

  // Certificate ID lives inside the "Enter Certificate ID" input box.
  // The box on the template has a baked-in placeholder we paint over.
  idBoxXFrac: 0.058,
  idBoxYFrac: 0.862,
  idBoxWFrac: 0.176,
  idBoxHFrac: 0.052,
  idSizeFrac: 0.015,
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

  // Certificate ID — wipe the "Enter Certificate ID" placeholder baked
  // into the template, then center the real number inside the input box.
  const idBoxX = Math.floor(W * POS.idBoxXFrac);
  const idBoxY = Math.floor(H * POS.idBoxYFrac);
  const idBoxW = Math.floor(W * POS.idBoxWFrac);
  const idBoxH = Math.floor(H * POS.idBoxHFrac);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(idBoxX + 2, idBoxY + 2, idBoxW - 4, idBoxH - 4);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = NAVY;
  ctx.font = `700 ${Math.max(12, Math.floor(W * POS.idSizeFrac))}px "Courier New", monospace`;
  ctx.fillText(input.certificateNumber, idBoxX + idBoxW / 2, idBoxY + idBoxH / 2);

  // QR code: white quiet-zone first, then the QR itself.
  const qrSize = Math.floor(W * POS.qrSizeFrac);
  const qrX = Math.floor(W * POS.qrXFrac);
  const qrY = Math.floor(H * POS.qrYFrac);
  const pad = Math.max(4, Math.floor(qrSize * 0.06));
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(qrX - pad, qrY - pad, qrSize + pad * 2, qrSize + pad * 2);

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
