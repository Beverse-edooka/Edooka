import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { certificates, users, programs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { renderCertificatePng } from "@/lib/certificate-template";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ certNumber: string }> }
) {
  const { certNumber } = await params;
  const normalized = decodeURIComponent(certNumber).trim().toUpperCase();

  const [row] = await db
    .select({ cert: certificates, user: users, program: programs })
    .from(certificates)
    .innerJoin(users, eq(certificates.userId, users.id))
    .innerJoin(programs, eq(certificates.programId, programs.id))
    .where(eq(certificates.certificateNumber, normalized))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  const { cert, user, program } = row;

  try {
    const buffer = await renderCertificatePng({
      fullName: user.name,
      courseName: program.title,
      certificateNumber: cert.certificateNumber,
      verifyUrl: cert.verificationUrl,
    });

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${cert.certificateNumber}.png"`,
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
