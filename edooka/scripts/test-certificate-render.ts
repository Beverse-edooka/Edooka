import { writeFileSync } from "fs";
import { join } from "path";
import { renderCertificatePng } from "../src/lib/certificate-template";
import { verifyUrlForCertificate } from "../src/lib/app-url";

async function main() {
  const cert = "EDK-2026-TEST01";
  const buffer = await renderCertificatePng({
    fullName: "Krishna Test",
    courseName: "Diagnostic Lab Operations",
    certificateNumber: cert,
    verifyUrl: verifyUrlForCertificate(cert),
  });
  const out = join(process.cwd(), "certificate-render-test.png");
  writeFileSync(out, buffer);
  console.log("Wrote", out, buffer.length, "bytes");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
