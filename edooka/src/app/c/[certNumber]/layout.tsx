import type { Metadata } from "next";
import { certificateShareMetadata } from "@/lib/certificate-share-metadata";
import { certificateShortShareUrl } from "@/lib/share-certificate";

export const dynamic = "force-dynamic";

type Props = {
  children: React.ReactNode;
  params: Promise<{ certNumber: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { certNumber: raw } = await params;
  const certNumber = decodeURIComponent(raw).trim();
  return certificateShareMetadata(certNumber, certificateShortShareUrl(certNumber));
}

export default function ShortCertificateShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
