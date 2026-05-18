import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { certificates, users, programs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import JSZip from "jszip";
 
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email: string = body.email?.trim()?.toLowerCase();
    const certNumbers: string[] | undefined = body.certNumbers;
 
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }
 
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
 
    if (!user) {
      return NextResponse.json(
        { error: "No certificates found for this email address." },
        { status: 404 }
      );
    }
 
    let userCerts = await db
      .select({ cert: certificates, program: programs })
      .from(certificates)
      .innerJoin(programs, eq(certificates.programId, programs.id))
      .where(eq(certificates.userId, user.id))
      .orderBy(certificates.issuedAt);
 
    if (certNumbers && certNumbers.length > 0) {
      userCerts = userCerts.filter((r) =>
        certNumbers.includes(r.cert.certificateNumber)
      );
    }
 
    if (userCerts.length === 0) {
      return NextResponse.json(
        { error: "No certificates found." },
        { status: 404 }
      );
    }
 
    const zip = new JSZip();
    const folder = zip.folder("Edooka Certificates")!;
 
    const downloads = userCerts.map(async ({ cert, program }) => {
      try {
        const res = await fetch(cert.pdfUrl);
        if (!res.ok) throw new Error(`Failed to fetch ${cert.certificateNumber}`);
        const buffer = await res.arrayBuffer();
        const safeProgram = program.title.replace(/[^a-zA-Z0-9\s]/g, "").trim().slice(0, 40);
        folder.file(`${cert.certificateNumber} — ${safeProgram}.pdf`, buffer);
      } catch {
        console.error(`[bundle] Could not fetch cert ${cert.certificateNumber}`);
      }
    });
 
    await Promise.all(downloads);
 
    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });
 
    const fileName = `Edooka-Certificates-${user.name.replace(/\s+/g, "-")}.zip`;
 
    return new NextResponse(zipBuffer as any, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[bundle/download]", err);
    return NextResponse.json({ error: "Bundle generation failed" }, { status: 500 });
  }
}
