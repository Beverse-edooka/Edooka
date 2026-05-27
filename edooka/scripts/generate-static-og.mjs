import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas } from "@napi-rs/canvas";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "og");
mkdirSync(outDir, { recursive: true });

const width = 1200;
const height = 630;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext("2d");

const gradient = ctx.createLinearGradient(0, 0, width, height);
gradient.addColorStop(0, "#fff5ef");
gradient.addColorStop(1, "#ffffff");
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, width, height);

ctx.fillStyle = "#ff6b35";
ctx.fillRect(0, 0, width, 10);

ctx.fillStyle = "#18181b";
ctx.font = "bold 56px sans-serif";
ctx.fillText("edooka", 72, 110);

ctx.fillStyle = "#ff6b35";
ctx.font = "bold 26px sans-serif";
ctx.fillText("VERIFIED CERTIFICATE", 72, 165);

ctx.fillStyle = "#18181b";
ctx.font = "bold 52px sans-serif";
ctx.fillText("Skill Assessment Certificate", 72, 280);

ctx.fillStyle = "#52525b";
ctx.font = "36px sans-serif";
ctx.fillText("Share your achievement on WhatsApp & LinkedIn", 72, 430);

ctx.fillStyle = "#ff6b35";
ctx.font = "bold 34px sans-serif";
ctx.fillText("edooka.in", 72, 540);

const jpeg = canvas.toBuffer("image/jpeg", 0.88);
const outPath = join(outDir, "edooka-certificate-share.jpg");
writeFileSync(outPath, jpeg);
console.log(`Wrote ${outPath} (${jpeg.length} bytes)`);
