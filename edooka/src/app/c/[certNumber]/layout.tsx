import type { Metadata } from "next";
import { certificateShareMetadata } from "@/lib/certificate-share-metadata";
import { certificateShortShareUrl } from "@/lib/share-certificate";

type Props = {
  children: React.ReactNode;
  params: Promise<{ certNumber: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { certNumber: raw } = await params;
  const certNumber = decodeURIComponent(raw).trim();
  const pageUrl = certificateShortShareUrl(certNumber);
  const ogImagePath = `/c/${encodeURIComponent(certNumber)}/opengraph-image`;
  return certificateShareMetadata(certNumber, pageUrl, ogImagePath);
}

export default function ShortCertificateShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
