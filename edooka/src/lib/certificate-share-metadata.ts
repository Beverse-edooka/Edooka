import type { Metadata } from "next";
import { certificateOgImageApiUrl } from "@/lib/share-certificate";
import {
  buildCertificateOpenGraphDescription,
  buildCertificateOpenGraphTitle,
} from "@/lib/share-certificate";
import { getCertificateByNumber } from "@/server/queries/certificates";

export async function certificateShareMetadata(
  certNumber: string,
  pageUrl: string,
): Promise<Metadata> {
  const ogImage = certificateOgImageApiUrl(certNumber);

  let title = "Edooka Certificate";
  let description =
    "I earned a verifiable skill assessment certificate from Edooka. Take your free assessment and get certified.";

  try {
    const row = await getCertificateByNumber(certNumber);
    if (row && !row.revoked) {
      title = buildCertificateOpenGraphTitle(row.holderName);
      description = buildCertificateOpenGraphDescription(row.programTitle);
    }
  } catch {
    /* use defaults */
  }

  return {
    title,
    description,
    metadataBase: undefined,
    openGraph: {
      type: "website",
      url: pageUrl,
      siteName: "Edooka",
      title,
      description,
      locale: "en_IN",
      images: [
        {
          url: ogImage,
          secureUrl: ogImage,
          width: 1200,
          height: 630,
          alt: title,
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    alternates: {
      canonical: pageUrl,
    },
    other: {
      "og:image": ogImage,
      "og:image:secure_url": ogImage,
      "og:image:type": "image/jpeg",
      "og:image:width": "1200",
      "og:image:height": "630",
    },
  };
}
