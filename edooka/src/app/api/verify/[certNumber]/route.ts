import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { certificates, programs, users } from "@/lib/db/schema";

/**
 * GET /api/verify/[certNumber] — public certificate lookup.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ certNumber: string }> }
) {
  const { certNumber } = await context.params;
  const normalized = decodeURIComponent(certNumber).trim().toUpperCase();

  if (!normalized) {
    return NextResponse.json({ valid: false, error: "Certificate number is required." }, { status: 400 });
  }

  try {
    const rows = await db
      .select({
        certificateNumber: certificates.certificateNumber,
        issuedAt: certificates.issuedAt,
        holderName: users.name,
        programTitle: programs.title,
        programCategory: programs.category,
      })
      .from(certificates)
      .innerJoin(users, eq(certificates.userId, users.id))
      .innerJoin(programs, eq(certificates.programId, programs.id))
      .where(eq(certificates.certificateNumber, normalized))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return NextResponse.json({
        valid: false,
        certificateNumber: normalized,
        message: "No certificate found with this number.",
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
  } catch {
    return NextResponse.json(
      { valid: false, error: "Verification service is temporarily unavailable." },
      { status: 503 }
    );
  }
}
