import { NextRequest, NextResponse } from "next/server";
import {
  ensureCertificateOgJpeg,
  ogImageResponseHeaders,
} from "@/lib/certificate-og-image";

export const runtime = "nodejs";

/** Legacy alias — serves the same compressed JPEG as /share/certificate/[id]/opengraph-image */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ certNumber: string }> },
) {
  const { certNumber } = await params;
  try {
    const jpeg = await ensureCertificateOgJpeg(certNumber);
    if (!jpeg) return new NextResponse(null, { status: 404 });
    return new NextResponse(jpeg as unknown as BodyInit, {
      headers: ogImageResponseHeaders(),
    });
  } catch (e) {
    console.error("[og/certificate]", e);
    return new NextResponse(null, { status: 500 });
  }
}
