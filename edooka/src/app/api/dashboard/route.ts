import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { certificates, purchases, users, programs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getCertificateCountForBundle } from "@/lib/pricing";
import type { BundleType } from "@/types";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return NextResponse.json({ found: false, certs: [], credits: 0 });
  }

  const userCerts = await db
    .select({
      id:                certificates.id,
      certificateNumber: certificates.certificateNumber,
      pdfUrl:            certificates.pdfUrl,
      verificationUrl:   certificates.verificationUrl,
      issuedAt:          certificates.issuedAt,
      programTitle:      programs.title,
      programSlug:       programs.slug,
      programCategory:   programs.category,
    })
    .from(certificates)
    .innerJoin(programs, eq(certificates.programId, programs.id))
    .where(eq(certificates.userId, user.id))
    .orderBy(certificates.issuedAt);

  const allPurchases = await db
    .select()
    .from(purchases)
    .where(and(
      eq(purchases.userId, user.id),
      eq(purchases.paymentStatus, "success")
    ));

  let totalCredits = 0;
  for (const p of allPurchases) {
    const bundleSize = getCertificateCountForBundle(p.bundleType ?? "");
    const unlockedCount = Array.isArray(p.programsUnlocked) ? p.programsUnlocked.length : 0;
    totalCredits += bundleSize - unlockedCount;
  }

  return NextResponse.json({
    found:  true,
    name:   user.name,
    email:  user.email,
    certs:  userCerts,
    credits: Math.max(0, totalCredits),
  });
}
