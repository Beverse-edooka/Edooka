import { NextRequest, NextResponse } from "next/server";
import { renderCertificatePng } from "@/lib/certificate-template";
import { verifyUrlForCertificate } from "@/lib/app-url";

export const runtime = "nodejs";

/** POST — generate certificate PNG from template (no cloud storage). */
export async function POST(req: NextRequest) {
  let body: {
    fullName?: string;
    courseName?: string;
    certificateNumber?: string;
    verifyUrl?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fullName = body.fullName?.trim() || "Learner";
  const courseName = body.courseName?.trim() || "Healthcare Professional";
  const certificateNumber = body.certificateNumber?.trim() || "EDK-PENDING";
  const verifyUrl = body.verifyUrl?.trim() || verifyUrlForCertificate(certificateNumber);

  try {
    const buffer = await renderCertificatePng({
      fullName,
      courseName,
      certificateNumber,
      verifyUrl,
    });
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Render failed" },
      { status: 500 }
    );
  }
}
