import { NextRequest, NextResponse } from "next/server";
import {
  getCertificateOgJpegForCrawler,
  getStaticFallbackOgJpeg,
  ogImageResponseHeaders,
} from "@/lib/certificate-og-image";
import { certificateOgImageApiUrl } from "@/lib/share-certificate";
import { resolveCertificate } from "@/server/queries/certificates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ certNumber: string }> },
) {
  const { certNumber } = await params;
  const normalized = decodeURIComponent(certNumber).trim();

  let holderName: string | undefined;
  let courseName: string | undefined;
  try {
    const row = await resolveCertificate(normalized);
    if (row && !row.revoked) {
      holderName = row.holderName;
      courseName = row.programTitle;
    }
  } catch {
    /* static fallback */
  }

  try {
    const jpeg = await getCertificateOgJpegForCrawler(normalized, {
      holderName,
      courseName,
    });
    return new NextResponse(jpeg as unknown as BodyInit, {
      headers: {
        ...ogImageResponseHeaders(),
        Link: `<${certificateOgImageApiUrl(normalized)}>; rel="canonical"`,
      },
    });
  } catch (e) {
    console.error("[og/certificate]", e);
    const jpeg = await getStaticFallbackOgJpeg({ holderName, courseName });
    return new NextResponse(jpeg as unknown as BodyInit, {
      headers: ogImageResponseHeaders(),
    });
  }
}
