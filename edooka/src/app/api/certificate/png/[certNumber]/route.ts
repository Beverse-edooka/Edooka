import { NextRequest, NextResponse } from "next/server";
import { getCertificateRenderInputFromDb } from "@/lib/certificate-from-db";
import { renderCertificatePng } from "@/lib/certificate-template";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ certNumber: string }> }
) {
  const { certNumber } = await params;
  const normalized = decodeURIComponent(certNumber).trim();
  const download = req.nextUrl.searchParams.get("download") === "1";

  const input = await getCertificateRenderInputFromDb(normalized);
  if (!input) {
    return NextResponse.json(
      {
        error: "Certificate not found in database",
        certificateNumber: normalized.trim().toUpperCase(),
        hint: "Register it first: POST /api/certificate/issue (or download from the success/redeem page in the app).",
      },
      { status: 404 }
    );
  }

  try {
    const buffer = await renderCertificatePng(input);
    const disposition = download
      ? `attachment; filename="${input.certificateNumber}.png"`
      : `inline; filename="${input.certificateNumber}.png"`;

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": disposition,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Render failed" },
      { status: 500 }
    );
  }
}
