import { existsSync } from "fs";
import { join } from "path";
import { GlobalFonts } from "@napi-rs/canvas";

const FONT_FILES = {
  sans: "DejaVuSans.ttf",
  sansBold: "DejaVuSans-Bold.ttf",
  serifItalic: "DejaVuSerif-Italic.ttf",
  mono: "DejaVuSansMono.ttf",
} as const;

export const CERT_FONTS = {
  name: "EdookaSerif",
  course: "EdookaSansBold",
  id: "EdookaMono",
} as const;

let registered = false;

function projectRoots(): string[] {
  const cwd = process.cwd();
  return [...new Set([cwd, join(cwd, "edooka")])];
}

function resolveBundledFile(...segments: string[]): string | null {
  for (const root of projectRoots()) {
    const full = join(root, ...segments);
    if (existsSync(full)) return full;
  }
  return null;
}

function fontDir(): string | null {
  return (
    resolveBundledFile("public", "fonts") ??
    resolveBundledFile("node_modules", "dejavu-fonts-ttf", "ttf")
  );
}

/** Register DejaVu TTFs (required on Linux serverless — no Arial/Georgia). */
export function ensureCertificateFontsRegistered(): void {
  if (registered) return;

  const ttfDir = fontDir();
  if (!ttfDir) {
    throw new Error(
      "Certificate fonts missing. Run npm install && npm run postinstall, then redeploy."
    );
  }

  const register = (file: string, family: string) => {
    const fontPath = join(ttfDir, file);
    if (!existsSync(fontPath)) {
      throw new Error(`Certificate font file not found: ${fontPath}`);
    }
    if (!GlobalFonts.registerFromPath(fontPath, family)) {
      throw new Error(`Could not register font ${family} from ${fontPath}`);
    }
  };

  register(FONT_FILES.sans, "EdookaSans");
  register(FONT_FILES.sansBold, CERT_FONTS.course);
  register(FONT_FILES.serifItalic, CERT_FONTS.name);
  register(FONT_FILES.mono, CERT_FONTS.id);

  registered = true;
}

export function resolveCertificateTemplatePath(): string {
  const templatePath = resolveBundledFile("public", "certificate-template.png");
  if (!templatePath) {
    throw new Error(
      "certificate-template.png missing under public/. Commit the file and redeploy."
    );
  }
  return templatePath;
}
