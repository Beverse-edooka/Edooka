import { createCanvas } from "@napi-rs/canvas";

/** Branded 1200×630 card — always works for WhatsApp when dynamic render/DB fails. */
export function renderStaticCertificateOgCard(options?: {
  holderName?: string;
  courseName?: string;
}): Buffer {
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#fff5ef");
  gradient.addColorStop(1, "#ffffff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#ff6b35";
  ctx.fillRect(0, 0, width, 10);

  ctx.fillStyle = "#18181b";
  ctx.font = "bold 56px sans-serif";
  ctx.fillText("edooka", 72, 110);

  ctx.fillStyle = "#ff6b35";
  ctx.font = "bold 26px sans-serif";
  ctx.fillText("VERIFIED CERTIFICATE", 72, 165);

  const course = (options?.courseName ?? "Skill Assessment").trim();
  ctx.fillStyle = "#18181b";
  ctx.font = "bold 52px sans-serif";
  wrapText(ctx, course, 72, 260, width - 144, 58);

  const holder = (options?.holderName ?? "Certificate holder").trim();
  ctx.fillStyle = "#52525b";
  ctx.font = "36px sans-serif";
  ctx.fillText(`Awarded to ${holder}`, 72, 430);

  ctx.fillStyle = "#ff6b35";
  ctx.font = "bold 34px sans-serif";
  ctx.fillText("edooka.in · Verify anytime", 72, 540);

  return canvas.toBuffer("image/jpeg", 0.85);
}

function wrapText(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let offsetY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, offsetY);
      line = word;
      offsetY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, offsetY);
}
