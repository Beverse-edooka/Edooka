import type { Metadata } from "next";
import { getAppOrigin } from "@/lib/app-url";
import {
  buildCertificateOpenGraphDescription,
  buildCertificateOpenGraphTitle,
} from "@/lib/share-certificate";
import { getCertificateByNumber } from "@/server/queries/certificates";

export async function certificateShareMetadata(
  certNumber: string,
  pageUrl: string,
  ogImagePath: string,
): Promise<Metadata> {
  const origin = getAppOrigin();
  const ogImage = `${origin}${ogImagePath.startsWith("/") ? ogImagePath : `/${ogImagePath}`}`;

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
    openGraph: {
      type: "website",
      url: pageUrl,
      siteName: "Edooka",
      title,
      description,
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
      images: [ogImage],
    },
    alternates: {
      canonical: pageUrl,
    },
  };
}
