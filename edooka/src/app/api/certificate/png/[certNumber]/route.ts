import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { certificates, users, programs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import QRCode from "qrcode";
 
export async function GET(
  _req: NextRequest,
  { params }: { params: { certNumber: string } }
) {
  const { certNumber } = params;
 
  const [row] = await db
    .select({ cert: certificates, user: users, program: programs })
    .from(certificates)
    .innerJoin(users, eq(certificates.userId, users.id))
    .innerJoin(programs, eq(certificates.programId, programs.id))
    .where(eq(certificates.certificateNumber, certNumber))
    .limit(1);
 
  if (!row) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }
 
  const { cert, user, program } = row;
  const issuedDate = new Date(cert.issuedAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
 
  const W = 1684;
  const H = 1190;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
 
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);
 
  ctx.save();
  ctx.strokeStyle = "rgba(255, 107, 53, 0.04)";
  ctx.lineWidth = 1;
  for (let i = -H; i < W + H; i += 28) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H, H);
    ctx.stroke();
  }
  ctx.restore();
 
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, "#FF6B35");
  grad.addColorStop(0.5, "#FF9558");
  grad.addColorStop(1, "#FF6B35");
 
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 18);
  ctx.fillRect(0, H - 12, W, 12);
 
  roundedRect(ctx, 22, 22, W - 44, H - 44, 18, "#FF6B35", 5, "stroke");
  roundedRect(ctx, 34, 34, W - 68, H - 68, 14, "#FFD4BC", 1, "stroke");
 
  const corners = [
    [22, 22, 0],
    [W - 22, 22, 90],
    [W - 22, H - 22, 180],
    [22, H - 22, 270],
  ] as [number, number, number][];
 
  for (const [cx, cy, deg] of corners) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((deg * Math.PI) / 180);
    ctx.fillStyle = "#FF6B35";
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(48, 0);
    ctx.lineTo(48, 8);
    ctx.lineTo(8, 8);
    ctx.lineTo(8, 48);
    ctx.lineTo(0, 48);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
 
  const lx = 80, ly = 52, ls = 88;
  roundedRect(ctx, lx, ly, ls, ls, 20, "#FF6B35", 0, "fill");
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 56px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("e", lx + ls / 2, ly + ls / 2 + 3);
 
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#FF6B35";
  ctx.font = "bold 36px sans-serif";
  ctx.letterSpacing = "8px";
  ctx.fillText("EDOOKA", lx + ls + 20, ly + 44);
  ctx.fillStyle = "#71717A";
  ctx.font = "400 17px sans-serif";
  ctx.letterSpacing = "3px";
  ctx.fillText("CERTIFICATE OF SKILL VALIDATION", lx + ls + 20, ly + 72);
  ctx.letterSpacing = "0px";
 
  const dg = ctx.createLinearGradient(lx, 0, lx + 500, 0);
  dg.addColorStop(0, "#FF6B35");
  dg.addColorStop(1, "rgba(255,107,53,0)");
  ctx.fillStyle = dg;
  ctx.fillRect(lx, ly + ls + 16, 420, 2);
 
  const sx = W - 148, sy = 55, sr = 62;
  ctx.save();
  ctx.beginPath();
  ctx.arc(sx, sy + sr, sr, 0, Math.PI * 2);
  ctx.fillStyle = "#FFF5EF";
  ctx.fill();
  ctx.strokeStyle = "#FF6B35";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#FF6B35";
  ctx.font = "bold 26px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("★", sx, sy + sr - 18);
  ctx.font = "bold 11px sans-serif";
  ctx.letterSpacing = "1px";
  ctx.fillText("SKILL", sx, sy + sr + 6);
  ctx.fillText("VALIDATED", sx, sy + sr + 22);
  ctx.fillText("2026", sx, sy + sr + 38);
  ctx.letterSpacing = "0px";
  ctx.restore();
 
  const bodyY = 310;
 
  ctx.textAlign = "center";
  ctx.fillStyle = "#71717A";
  ctx.font = "italic 26px sans-serif";
  ctx.fillText("This is to certify that", W / 2, bodyY);
 
  ctx.fillStyle = "#18181B";
  ctx.font = "bold 78px sans-serif";
  ctx.fillText(user.name, W / 2, bodyY + 98);
 
  const nameWidth = ctx.measureText(user.name).width;
  const nlx = W / 2 - Math.min(nameWidth / 2, 320);
  const nlw = Math.min(nameWidth, 640);
  ctx.fillStyle = "#FF6B35";
  ctx.fillRect(nlx, bodyY + 116, nlw, 5);
 
  ctx.fillStyle = "#71717A";
  ctx.font = "italic 24px sans-serif";
  ctx.fillText("has demonstrated proficiency in", W / 2, bodyY + 160);
 
  ctx.fillStyle = "#FF6B35";
  ctx.font = "bold 40px sans-serif";
  wrapText(ctx, program.title, W / 2, bodyY + 212, 900, 52);
 
  const statsY = bodyY + 320;
  const stats = [
    ["18 Questions", "ASSESSED"],
    ["50% Pass Mark", "THRESHOLD"],
    [issuedDate, "ISSUED ON"],
  ];
  const statSpacing = 340;
  const statStartX = W / 2 - statSpacing;
 
  for (let i = 0; i < stats.length; i++) {
    const [val, label] = stats[i];
    const x = statStartX + i * statSpacing;
    ctx.textAlign = "center";
    ctx.fillStyle = "#18181B";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(val, x, statsY);
    ctx.fillStyle = "#A1A1AA";
    ctx.font = "600 13px sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillText(label, x, statsY + 22);
    ctx.letterSpacing = "0px";
 
    if (i < stats.length - 1) {
      ctx.fillStyle = "#EAEAE6";
      ctx.fillRect(x + 140, statsY - 16, 1, 36);
    }
  }
 
  const footY = H - 100;
  ctx.fillStyle = "#EAEAE6";
  ctx.fillRect(80, footY - 10, 260, 1);
  ctx.fillRect(W / 2 - 130, footY - 10, 260, 1);
  ctx.fillRect(W - 340, footY - 10, 260, 1);
 
  ctx.textAlign = "center";
  ctx.fillStyle = "#18181B";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("Beverse Innovations Pvt. Ltd.", 210, footY + 16);
  ctx.fillStyle = "#A1A1AA";
  ctx.font = "600 13px sans-serif";
  ctx.letterSpacing = "1.5px";
  ctx.fillText("ISSUING AUTHORITY", 210, footY + 36);
  ctx.letterSpacing = "0px";
 
  roundedRect(ctx, W / 2 - 150, footY - 4, 300, 52, 10, "#FAFAF7", 0, "fill");
  roundedRect(ctx, W / 2 - 150, footY - 4, 300, 52, 10, "#EAEAE6", 1, "stroke");
  ctx.fillStyle = "#FF6B35";
  ctx.font = "bold 20px monospace";
  ctx.letterSpacing = "2px";
  ctx.fillText(certNumber, W / 2, footY + 14);
  ctx.letterSpacing = "0px";
  ctx.fillStyle = "#A1A1AA";
  ctx.font = "600 11px sans-serif";
  ctx.letterSpacing = "1.5px";
  ctx.fillText("CERTIFICATE NUMBER", W / 2, footY + 34);
  ctx.letterSpacing = "0px";
 
  ctx.fillStyle = "#18181B";
  ctx.font = "bold 15px sans-serif";
  const verifyShort = cert.verificationUrl.replace("https://", "");
  ctx.fillText(verifyShort, W - 210, footY + 16);
  ctx.fillStyle = "#A1A1AA";
  ctx.font = "600 13px sans-serif";
  ctx.letterSpacing = "1.5px";
  ctx.fillText("VERIFY ONLINE", W - 210, footY + 36);
  ctx.letterSpacing = "0px";
 
  const qrSize = 130;
  const qrX = W - qrSize - 60;
  const qrY = H - qrSize - 160;
 
  const qrDataUrl = await QRCode.toDataURL(cert.verificationUrl, {
    width: qrSize * 2,
    margin: 1,
    color: { dark: "#18181B", light: "#FFFFFF" },
    errorCorrectionLevel: "H",
  });
 
  const qrImg = await loadImage(qrDataUrl);
 
  roundedRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 36, 10, "#FFFFFF", 0, "fill");
  roundedRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 36, 10, "#EAEAE6", 1, "stroke");
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
  ctx.fillStyle = "#A1A1AA";
  ctx.font = "500 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Scan to verify", qrX + qrSize / 2, qrY + qrSize + 18);
 
  ctx.fillStyle = "#CCCCCC";
  ctx.font = "400 13px sans-serif";
  ctx.textAlign = "center";
  const disc = "This certificate validates skill competency for professional development. Not a CPD/CME credit. Not endorsed by NMC, INC, MCI, or state councils. Issued by Beverse Innovations Pvt. Ltd.";
  ctx.fillText(disc, W / 2, H - 22);
 
  const buffer = canvas.toBuffer("image/png");
 
  return new NextResponse(buffer as any, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${certNumber}.png"`,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
 
function roundedRect(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  x: number, y: number, w: number, h: number, r: number,
  color: string, lineWidth: number, mode: "fill" | "stroke"
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  if (mode === "fill") {
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  ctx.restore();
}
 
function wrapText(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  text: string, x: number, y: number, maxW: number, lineH: number
) {
  const words = text.split(" ");
  let line = "";
  let lineY = y;
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxW && line !== "") {
      ctx.fillText(line.trim(), x, lineY);
      line = word + " ";
      lineY += lineH;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, lineY);
}
