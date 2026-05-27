import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { certificates } from "@/lib/db/schema";
import { getCertificateRenderInputFromDb } from "@/lib/certificate-from-db";
import { renderCertificatePng } from "@/lib/certificate-template";

export const runtime = "nodejs";

const PNG_HEADERS = {
  "Content-Type": "image/png",
  "Content-Disposition": "inline",
  // 30-day CDN + 1-day browser cache. s-maxage makes Vercel/Railway edge cache it.
  "Cache-Control": "public, s-maxage=2592000, max-age=86400, stale-while-revalidate=86400, immutable",
  "Access-Control-Allow-Origin": "*",
  "X-Content-Type-Options": "nosniff",
};

/**
 * GET /api/og/certificate/[certNumber]
 *
 * Serves the certificate PNG for og:image meta tags.
 *
 * Fast path (< 10 ms): reads pre-rendered base64 PNG stored in the DB at issue time.
 * Slow fallback: live canvas render (only for old certificates that predate this column).
 *
 * WhatsApp/LinkedIn crawlers get a response well within their 3-second timeout.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ certNumber: string }> },
) {
  const { certNumber } = await params;
  const normalized = decodeURIComponent(certNumber).trim().toUpperCase();
  if (!normalized) return new NextResponse(null, { status: 400 });

  try {
    // Fast path: read stored PNG from DB.
    const [row] = await db
      .select({ pngData: certificates.pngData })
      .from(certificates)
      .where(eq(certificates.certificateNumber, normalized))
      .limit(1);

    if (row?.pngData) {
      const buffer = Buffer.from(row.pngData, "base64");
      return new NextResponse(buffer as unknown as BodyInit, { headers: PNG_HEADERS });
    }

    // Fallback: live render (old certificates without stored PNG).
    const input = await getCertificateRenderInputFromDb(normalized);
    if (!input) return new NextResponse(null, { status: 404 });

    const buffer = await renderCertificatePng(input);

    // Store for future requests so next crawl is fast.
    void db
      .update(certificates)
      .set({ pngData: buffer.toString("base64") })
      .where(eq(certificates.certificateNumber, normalized))
      .catch(() => {});

    return new NextResponse(buffer as unknown as BodyInit, { headers: PNG_HEADERS });
  } catch (e) {
    console.error("[og/certificate]", e);
    return new NextResponse(null, { status: 500 });
  }
}
