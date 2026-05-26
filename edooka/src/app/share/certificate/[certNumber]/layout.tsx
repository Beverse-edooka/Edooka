import type { Metadata } from "next";
import { getAppOrigin } from "@/lib/app-url";
import { buildCertificateShareCaption } from "@/lib/share-certificate";
import { getCertificateByNumber } from "@/server/queries/certificates";

type Props = {
  children: React.ReactNode;
  params: Promise<{ certNumber: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { certNumber: raw } = await params;
  const certNumber = decodeURIComponent(raw).trim();
  const origin = getAppOrigin();
  const image = `${origin}/api/certificate/png/${encodeURIComponent(certNumber)}`;
  const pageUrl = `${origin}/share/certificate/${encodeURIComponent(certNumber)}`;

  let description =
    "I earned a verifiable skill assessment certificate from Edooka. Take your free assessment and get certified.";

  try {
    const row = await getCertificateByNumber(certNumber);
    if (row && !row.revoked) {
      description = buildCertificateShareCaption(row.programTitle, row.programSlug);
    }
  } catch {
    /* use default description */
  }

  return {
    title: "My Edooka certificate",
    description,
    openGraph: {
      type: "website",
      url: pageUrl,
      siteName: "Edooka",
      title: "Edooka certificate of achievement",
      description,
      images: [{ url: image, width: 1024, height: 683, alt: "Edooka certificate" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "My Edooka certificate",
      description,
      images: [image],
    },
  };
}

export default function ShareCertificateLayout({ children }: Props) {
  return children;
}
