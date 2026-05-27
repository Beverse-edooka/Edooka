import { NextRequest, NextResponse } from "next/server";
import { getCertificateRenderInputFromDb } from "@/lib/certificate-from-db";
import { renderCertificatePng } from "@/lib/certificate-template";

export const runtime = "nodejs";

/**
 * GET /api/og/certificate/[certNumber]
 *
 * Dedicated Open Graph image endpoint used in og:image meta tags.
 * Unlike /api/certificate/png/[certNumber] (which is also used for downloads),
 * this route:
 *  1. Renders the PNG inline
 *  2. Sets a long CDN cache (immutable) so Vercel/Railway edges cache it after
 *     the first crawl hit — subsequent WhatsApp/LinkedIn crawls get instant
 *     responses from the CDN without hitting the serverless function.
 *
 * WhatsApp's crawler has a ~3s timeout. After the first warm hit this route
 * responds from CDN in <100 ms.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ certNumber: string }> },
) {
  const { certNumber } = await params;
  const normalized = decodeURIComponent(certNumber).trim();

  const input = await getCertificateRenderInputFromDb(normalized);
  if (!input) {
    // Return a plain 404 — no body — so crawlers don't cache an error page as the image.
    return new NextResponse(null, { status: 404 });
  }

  try {
    const buffer = await renderCertificatePng(input);

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="${input.certificateNumber}.png"`,
        // Long CDN cache: after first hit Vercel/Railway edge serves from cache instantly.
        "Cache-Control": "public, s-maxage=2592000, max-age=86400, stale-while-revalidate=86400, immutable",
        // Allow WhatsApp, LinkedIn, Facebook crawlers.
        "Access-Control-Allow-Origin": "*",
        // Force non-buffered streaming so the response starts immediately.
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return new NextResponse(null, {
      status: 500,
      headers: { "X-Error": e instanceof Error ? e.message : "Render failed" },
    });
  }
}
