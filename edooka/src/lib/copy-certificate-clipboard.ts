/** Normalize to PNG for clipboard APIs (some browsers reject unknown blob types). */
export function toPngBlob(blob: Blob): Blob {
  if (blob.type === "image/png") return blob;
  return new Blob([blob], { type: "image/png" });
}

/** Copy-event fallback when `navigator.clipboard.write` fails (common on Windows + async fetch). */
function copyPngViaCopyEvent(pngBlob: Blob): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve(false);
      return;
    }

    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      document.removeEventListener("copy", onCopy);
      resolve(ok);
    };

    const onCopy = (event: ClipboardEvent) => {
      event.preventDefault();
      const dt = event.clipboardData;
      if (!dt) {
        finish(false);
        return;
      }
      try {
        const file = new File([pngBlob], "edooka-certificate.png", { type: "image/png" });
        dt.items.add(file);
        finish(true);
      } catch {
        finish(false);
      }
    };

    document.addEventListener("copy", onCopy);
    const ok = document.execCommand("copy");
    if (!ok) finish(false);
    window.setTimeout(() => finish(false), 150);
  });
}

/** Copy certificate PNG to the system clipboard. Returns true if copy likely succeeded. */
export async function copyCertificatePngToClipboard(blob: Blob): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const png = toPngBlob(blob);

  if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
      return true;
    } catch {
      /* try copy-event fallback */
    }
  }

  return copyPngViaCopyEvent(png);
}
