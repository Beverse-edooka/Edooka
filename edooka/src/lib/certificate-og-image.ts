import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { certificates } from "@/lib/db/schema";
import { getCertificateRenderInputFromDb } from "@/lib/certificate-from-db";
import { renderCertificatePng } from "@/lib/certificate-template";
import { renderStaticCertificateOgCard } from "@/lib/static-certificate-og-card";
import { resolveCertificateNumber } from "@/server/queries/certificates";

/** WhatsApp reliably shows previews when og:image is under ~300 KB. */
const WHATSAPP_OG_MAX_BYTES = 280_000;

const OG_HEADERS = {
  "Content-Type": "image/jpeg",
  "Content-Disposition": "inline",
  "Cache-Control": "public, s-maxage=2592000, max-age=86400, stale-while-revalidate=86400, immutable",
  "Access-Control-Allow-Origin": "*",
  "X-Content-Type-Options": "nosniff",
} as const;

export function ogImageResponseHeaders(): HeadersInit {
  return { ...OG_HEADERS };
}

let staticFileJpeg: Buffer | null | undefined;

function getPublicStaticOgJpeg(): Buffer | null {
  if (staticFileJpeg !== undefined) return staticFileJpeg;
  try {
    staticFileJpeg = readFileSync(
      join(process.cwd(), "public", "og", "edooka-certificate-share.jpg"),
    );
    return staticFileJpeg;
  } catch {
    staticFileJpeg = null;
    return null;
  }
}

/** Last-resort preview image so WhatsApp always gets a 200 JPEG. */
export async function getStaticFallbackOgJpeg(options?: {
  holderName?: string;
  courseName?: string;
}): Promise<Buffer> {
  const fromFile = getPublicStaticOgJpeg();
  if (fromFile && fromFile.length > 0) return fromFile;
  return renderStaticCertificateOgCard(options);
}

/** Resize + JPEG compress so WhatsApp / Facebook crawlers accept the preview image. */
export async function compressCertificateForOg(pngBuffer: Buffer): Promise<Buffer> {
  const img = await loadImage(pngBuffer);
  const maxWidth = 1200;
  const scale = img.width > maxWidth ? maxWidth / img.width : 1;
  const w = Math.max(300, Math.round(img.width * scale));
  const h = Math.max(200, Math.round(img.height * scale));

  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  for (const quality of [0.88, 0.8, 0.72, 0.65, 0.55]) {
    const jpeg = canvas.toBuffer("image/jpeg", quality);
    if (jpeg.length <= WHATSAPP_OG_MAX_BYTES) return jpeg;
  }

  return canvas.toBuffer("image/jpeg", 0.5);
}

async function resolveForStorage(certNumber: string): Promise<string | null> {
  return resolveCertificateNumber(certNumber);
}

/** Read stored OG JPEG (png_data column stores base64 JPEG bytes). */
export async function getStoredOgJpeg(certNumber: string): Promise<Buffer | null> {
  const normalized = await resolveForStorage(certNumber);
  if (!normalized) return null;

  try {
    const [row] = await db
      .select({ pngData: certificates.pngData })
      .from(certificates)
      .where(eq(certificates.certificateNumber, normalized))
      .limit(1);

    if (!row?.pngData) return null;

    const buf = Buffer.from(row.pngData, "base64");
    if (buf.length === 0) return null;

    // Legacy rows stored full PNG — recompress once and update DB.
    if (buf[0] === 0x89 && buf[1] === 0x50) {
      const jpeg = await compressCertificateForOg(buf);
      void db
        .update(certificates)
        .set({ pngData: jpeg.toString("base64") })
        .where(eq(certificates.certificateNumber, normalized))
        .catch(() => {});
      return jpeg;
    }

    return buf;
  } catch {
    return null;
  }
}

/** Render certificate, compress to JPEG, persist for fast crawler reads. */
export async function ensureCertificateOgJpeg(certNumber: string): Promise<Buffer | null> {
  const normalized = await resolveForStorage(certNumber);
  if (!normalized) return null;

  const cached = await getStoredOgJpeg(normalized);
  if (cached) return cached;

  const input = await getCertificateRenderInputFromDb(normalized);
  if (!input) return null;

  const png = await renderCertificatePng(input);
  const jpeg = await compressCertificateForOg(png);

  try {
    await db
      .update(certificates)
      .set({ pngData: jpeg.toString("base64") })
      .where(eq(certificates.certificateNumber, normalized));
  } catch {
    /* column may be missing on unmigrated DB */
  }

  return jpeg;
}

/** Dynamic certificate JPEG, else static branded card (never 404 for crawlers). */
export async function getCertificateOgJpegForCrawler(
  certNumber: string,
  meta?: { holderName?: string; courseName?: string },
): Promise<Buffer> {
  const dynamic = await ensureCertificateOgJpeg(certNumber);
  if (dynamic) return dynamic;
  return getStaticFallbackOgJpeg(meta);
}
