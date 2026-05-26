import { createCanvas } from "@napi-rs/canvas";
import { NextRequest, NextResponse } from "next/server";
import { getProgramBySlug } from "@/data/programs";

export const runtime = "nodejs";

/** Social preview image (1200×630) for WhatsApp / LinkedIn link shares to /start/[slug]. */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")?.trim() ?? "";
  const program = slug ? getProgramBySlug(slug) : undefined;
  const title = program?.title ?? "Healthcare Skill Assessment";
  const category = program?.category ?? "Edooka";

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
  ctx.font = "bold 52px sans-serif";
  ctx.fillText("edooka", 72, 120);

  ctx.fillStyle = "#ff6b35";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText(category.toUpperCase(), 72, 170);

  ctx.fillStyle = "#18181b";
  ctx.font = "bold 64px sans-serif";
  wrapText(ctx, title, 72, 280, width - 144, 72);

  ctx.fillStyle = "#52525b";
  ctx.font = "32px sans-serif";
  ctx.fillText("Free 15-minute assessment · Verifiable certificate", 72, 480);

  ctx.fillStyle = "#ff6b35";
  ctx.font = "bold 36px sans-serif";
  ctx.fillText("edooka.in", 72, 560);

  const png = canvas.toBuffer("image/png");
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

function wrapText(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
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
