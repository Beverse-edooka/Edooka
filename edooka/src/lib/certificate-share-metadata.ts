import type { Metadata } from "next";
import {
  buildCertificateOpenGraphDescription,
  buildCertificateOpenGraphTitle,
  certificateOgImageApiUrl,
  staticCertificateOgImageUrl,
} from "@/lib/share-certificate";
import { resolveCertificate } from "@/server/queries/certificates";

export async function certificateShareMetadata(
  lookupKey: string,
  pageUrl: string,
): Promise<Metadata> {
  const staticOg = staticCertificateOgImageUrl();

  let title = "Edooka Certificate";
  let description =
    "I earned a verifiable skill assessment certificate from Edooka. Take your free assessment and get certified.";
  let dynamicOg: string | null = null;

  try {
    const row = await resolveCertificate(lookupKey);
    if (row && !row.revoked) {
      title = buildCertificateOpenGraphTitle(row.holderName);
      description = buildCertificateOpenGraphDescription(row.programTitle);
      dynamicOg = certificateOgImageApiUrl(row.certificateNumber);
    }
  } catch {
    /* use defaults */
  }

  // Static JPG first — WhatsApp crawlers time out on cold API routes; static always works.
  const images = [
    {
      url: staticOg,
      secureUrl: staticOg,
      width: 1200,
      height: 630,
      alt: title,
      type: "image/jpeg" as const,
    },
    ...(dynamicOg
      ? [
          {
            url: dynamicOg,
            secureUrl: dynamicOg,
            width: 1200,
            height: 630,
            alt: title,
            type: "image/jpeg" as const,
          },
        ]
      : []),
  ];

  return {
    title,
    description,
    openGraph: {
      type: "website",
      url: pageUrl,
      siteName: "Edooka",
      title,
      description,
      locale: "en_IN",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: staticOg, width: 1200, height: 630, alt: title }],
    },
    alternates: {
      canonical: pageUrl,
    },
    other: {
      "og:image": staticOg,
      "og:image:secure_url": staticOg,
      "og:image:type": "image/jpeg",
      "og:image:width": "1200",
      "og:image:height": "630",
    },
  };
}
