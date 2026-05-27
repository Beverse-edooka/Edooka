import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { attempts, certificates, programs, purchases, users } from "@/lib/db/schema";
import { getAppOrigin, verifyUrlForCertificate } from "@/lib/app-url";
import { resolveCertificateIssueEmail } from "@/lib/certificate-issue-email";
import { resolvePaymentPaidForOrder } from "@/lib/cashfree-order";
import { getActiveProgramBySlug } from "@/server/queries/programs";
import type { BundleType } from "@/types";

export const runtime = "nodejs";

function newQrToken(): string {
  return randomBytes(16).toString("hex");
}

/**
 * POST /api/certificate/issue
 * Persists certificate + purchase in Postgres (verify works; no file storage).
 */
export async function POST(req: NextRequest) {
  let body: {
    attemptId?: string;
    orderId?: string;
    bundleKey?: string;
    slug?: string;
    certificateNumber?: string;
    name?: string;
    email?: string;
    phone?: string;
    programTitle?: string;
    score?: number;
    total?: number;
    passed?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const attemptId = body.attemptId?.trim();
  const orderId = body.orderId?.trim();
  const slug = body.slug?.trim();
  const certNumber = body.certificateNumber?.trim().toUpperCase();
  const name = body.name?.trim() || "Learner";
  const phone = body.phone?.trim() || "0000000000";

  if (!attemptId || !orderId || !slug || !certNumber) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const payment = await resolvePaymentPaidForOrder(orderId, false);
  if (!payment.paid) {
    return NextResponse.json(
      {
        error: "payment_not_completed",
        orderStatus: payment.orderStatus,
        message: payment.message ?? "Payment must be completed before issuing a certificate.",
      },
      { status: 402 }
    );
  }

  const email = resolveCertificateIssueEmail(body.email, attemptId);

  const bundleKey = (body.bundleKey ?? "single") as BundleType;
  const qrToken = newQrToken();
  const verifyUrl = verifyUrlForCertificate(qrToken);
  const pdfUrl = `${getAppOrigin()}/api/certificate/png/${encodeURIComponent(certNumber)}`;

  try {
    let program = await getActiveProgramBySlug(slug);
    if (!program) {
      const [inactive] = await db
        .select()
        .from(programs)
        .where(eq(programs.slug, slug))
        .limit(1);
      program = inactive ?? null;
    }
    if (!program) {
      return NextResponse.json(
        {
          error: "program_not_found",
          hint: "Run npm run db:setup on your Neon database to seed programs.",
        },
        { status: 404 }
      );
    }

    let [existingAttempt] = await db
      .select()
      .from(attempts)
      .where(eq(attempts.id, attemptId))
      .limit(1);

    let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingAttempt) {
      const [attemptOwner] = await db
        .select()
        .from(users)
        .where(eq(users.id, existingAttempt.userId))
        .limit(1);
      if (attemptOwner) user = attemptOwner;
    }
    if (!user) {
      [user] = await db
        .insert(users)
        .values({ name, email, phone })
        .returning();
    }

    const [existingCert] = await db
      .select()
      .from(certificates)
      .where(eq(certificates.certificateNumber, certNumber))
      .limit(1);
    if (existingCert) {
      const [certUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, existingCert.userId))
        .limit(1);
      const holderName = certUser?.name?.trim() || user.name;
      return NextResponse.json({
        ok: true,
        certificateNumber: certNumber,
        verifyUrl: existingCert.verificationUrl,
        holderName,
        programTitle: program.title,
        programSlug: slug,
      });
    }

    // Attempt must exist before purchase (FK: purchases.attempt_id → attempts.id).
    if (!existingAttempt) {
      await db.insert(attempts).values({
        id: attemptId,
        userId: user.id,
        programId: program.id,
        questionIds: [],
        score: body.score ?? null,
        totalQuestions: body.total ?? program.numQuestions,
        passed: body.passed ?? true,
        completedAt: new Date(),
      });
    }

    let [purchase] = await db
      .select()
      .from(purchases)
      .where(eq(purchases.cashfreeOrderId, orderId))
      .limit(1);

    if (!purchase) {
      const amountPaise =
        bundleKey === "bundle5" ? 94400 : bundleKey === "bundle3" ? 59900 : 21800;
      [purchase] = await db
        .insert(purchases)
        .values({
          userId: user.id,
          bundleType: bundleKey,
          amountPaise,
          cashfreeOrderId: orderId,
          paymentStatus: "success",
          attemptId,
        })
        .returning();
    }

    await db.insert(certificates).values({
      userId: user.id,
      programId: program.id,
      attemptId,
      purchaseId: purchase.id,
      certificateNumber: certNumber,
      qrToken,
      pdfUrl,
      verificationUrl: verifyUrl,
    });

    // Fire-and-forget: warm the OG image CDN cache so WhatsApp's crawler
    // gets a fast response (<100 ms) instead of a cold-start render (3–8 s).
    const ogImageUrl = `${getAppOrigin()}/api/og/certificate/${encodeURIComponent(certNumber)}`;
    void fetch(ogImageUrl, { method: "GET" }).catch(() => {});

    return NextResponse.json({
      ok: true,
      certificateNumber: certNumber,
      verifyUrl,
      holderName: user.name,
      programTitle: program.title,
      programSlug: slug,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Issue failed";
    console.error("[certificate/issue]", message, e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
