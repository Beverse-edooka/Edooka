import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "node_modules", "dejavu-fonts-ttf", "ttf");
const destDir = join(root, "public", "fonts");

const files = [
  "DejaVuSans.ttf",
  "DejaVuSans-Bold.ttf",
  "DejaVuSerif-Italic.ttf",
  "DejaVuSansMono.ttf",
];

if (!existsSync(srcDir)) {
  console.warn("[copy-certificate-fonts] dejavu-fonts-ttf not installed; skip");
  process.exit(0);
}

mkdirSync(destDir, { recursive: true });
for (const file of files) {
  const src = join(srcDir, file);
  if (!existsSync(src)) {
    console.warn(`[copy-certificate-fonts] missing ${file}`);
    continue;
  }
  copyFileSync(src, join(destDir, file));
}
console.log("[copy-certificate-fonts] copied", readdirSync(destDir).length, "fonts to public/fonts");
