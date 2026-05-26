import { NextResponse } from "next/server";
import { getCertificateByNumber } from "@/server/queries/certificates";

/**
 * GET /api/verify/[token] — public certificate lookup.
 *
 * `token` may be either the human-readable certificate number
 * (e.g. `EDK-2026-00001`) entered on the verify form, or the opaque
 * `qrToken` encoded in the QR code on the certificate PNG.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ certNumber: string }> }
) {
  const { certNumber } = await context.params;
  const raw = decodeURIComponent(certNumber).trim();
  if (!raw) {
    return NextResponse.json(
      { valid: false, error: "Certificate number is required." },
      { status: 400 },
    );
  }

  const upper = raw.toUpperCase();

  try {
    const row = await getCertificateByNumber(raw);
    if (!row) {
      return NextResponse.json({
        valid: false,
        certificateNumber: upper,
        message: "No certificate found with this number.",
      });
    }

    if (row.revoked) {
      return NextResponse.json({
        valid: false,
        certificateNumber: row.certificateNumber,
        message: "This certificate has been revoked.",
      });
    }

    return NextResponse.json({
      valid: true,
      certificateNumber: row.certificateNumber,
      holderName: row.holderName,
      programTitle: row.programTitle,
      programSlug: row.programSlug,
      programCategory: row.programCategory,
      issuedAt: row.issuedAt?.toISOString() ?? null,
    });
  } catch (e) {
    console.error("[verify]", e);
    return NextResponse.json(
      { valid: false, error: "Verification service is temporarily unavailable." },
      { status: 503 },
    );
  }
}
