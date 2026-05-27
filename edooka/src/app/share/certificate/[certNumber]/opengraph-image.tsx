import {
  ensureCertificateOgJpeg,
  ogImageResponseHeaders,
} from "@/lib/certificate-og-image";

export const runtime = "nodejs";
export const alt = "Edooka certificate";
export const contentType = "image/jpeg";
export const size = { width: 1200, height: 630 };

/** Next.js native OG image — WhatsApp crawlers prefer this URL on the same path. */
export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ certNumber: string }>;
}) {
  const { certNumber } = await params;
  const jpeg = await ensureCertificateOgJpeg(certNumber);
  if (!jpeg) return new Response(null, { status: 404 });

  return new Response(jpeg as unknown as BodyInit, {
    headers: ogImageResponseHeaders(),
  });
}
