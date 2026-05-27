import type { Metadata } from "next";
import { getAppOrigin } from "@/lib/app-url";
import {
  buildCertificateOpenGraphDescription,
  buildCertificateOpenGraphTitle,
  certificateSharePageUrl,
} from "@/lib/share-certificate";
import { getCertificateByNumber } from "@/server/queries/certificates";

type Props = {
  children: React.ReactNode;
  params: Promise<{ certNumber: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { certNumber: raw } = await params;
  const certNumber = decodeURIComponent(raw).trim();
  const origin = getAppOrigin();
  const pageUrl = certificateSharePageUrl(certNumber);
  // Use the dedicated OG image route which sets a long CDN cache so WhatsApp's
  // crawler (3s timeout) always gets a fast response after the first warm hit.
  const image = `${origin}/api/og/certificate/${encodeURIComponent(certNumber)}`;

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
          url: image,
          secureUrl: image,
          width: 1024,
          height: 683,
          alt: title,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: pageUrl,
    },
  };
}

export default function ShareCertificateLayout({ children }: Props) {
  return children;
}
