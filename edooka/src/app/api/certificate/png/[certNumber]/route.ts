import { NextRequest, NextResponse } from "next/server";
import { getCertificateRenderInputFromDb } from "@/lib/certificate-from-db";
import { renderCertificatePng } from "@/lib/certificate-template";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ certNumber: string }> }
) {
  const { certNumber } = await params;
  const normalized = decodeURIComponent(certNumber).trim();

  const input = await getCertificateRenderInputFromDb(normalized);
  if (!input) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  try {
    const buffer = await renderCertificatePng(input);

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${input.certificateNumber}.png"`,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Render failed" },
      { status: 500 }
    );
  }
}
