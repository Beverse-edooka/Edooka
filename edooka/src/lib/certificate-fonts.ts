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

/** Project root on Vercel is usually `edooka/`; monorepo local dev may be repo root. */
function projectRoots(): string[] {
  const cwd = process.cwd();
  const roots = [cwd, join(cwd, "edooka")];
  return [...new Set(roots)];
}

function resolveBundledFile(...segments: string[]): string | null {
  for (const root of projectRoots()) {
    const full = join(root, ...segments);
    if (existsSync(full)) return full;
  }
  return null;
}

/** Register DejaVu TTFs from node_modules (required on Linux serverless — no Arial/Georgia). */
export function ensureCertificateFontsRegistered(): void {
  if (registered) return;

  const ttfDir = resolveBundledFile("node_modules", "dejavu-fonts-ttf", "ttf");
  if (!ttfDir) {
    throw new Error(
      "Certificate fonts missing. Run npm install (dejavu-fonts-ttf) and redeploy."
    );
  }

  const register = (file: string, family: string) => {
    const path = join(ttfDir, file);
    if (!existsSync(path)) {
      throw new Error(`Certificate font file not found: ${path}`);
    }
    if (!GlobalFonts.registerFromPath(path, family)) {
      throw new Error(`Could not register font ${family} from ${path}`);
    }
  };

  register(FONT_FILES.sans, "EdookaSans");
  register(FONT_FILES.sansBold, CERT_FONTS.course);
  register(FONT_FILES.serifItalic, CERT_FONTS.name);
  register(FONT_FILES.mono, CERT_FONTS.id);

  registered = true;
}

export function resolveCertificateTemplatePath(): string {
  const path = resolveBundledFile("public", "certificate-template.png");
  if (!path) {
    throw new Error(
      "certificate-template.png missing under public/. Commit the file and redeploy."
    );
  }
  return path;
}
