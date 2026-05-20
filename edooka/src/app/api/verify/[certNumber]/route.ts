import { eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { certificates, programs, users } from "@/lib/db/schema";

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

  // Cert numbers are stored upper-case; qrTokens are lower-case hex.
  // Try both shapes from the same input.
  const upper = raw.toUpperCase();
  const lower = raw.toLowerCase();

  try {
    const rows = await db
      .select({
        certificateNumber: certificates.certificateNumber,
        issuedAt: certificates.issuedAt,
        revoked: certificates.revoked,
        holderName: users.name,
        programTitle: programs.title,
        programCategory: programs.category,
      })
      .from(certificates)
      .innerJoin(users, eq(certificates.userId, users.id))
      .innerJoin(programs, eq(certificates.programId, programs.id))
      .where(
        or(
          eq(certificates.certificateNumber, upper),
          eq(certificates.qrToken, lower),
        ),
      )
      .limit(1);

    const row = rows[0];
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
