import type { Metadata } from "next";
import { certificateShareMetadata } from "@/lib/certificate-share-metadata";
import { certificateSharePageUrl } from "@/lib/share-certificate";

export const dynamic = "force-dynamic";

type Props = {
  children: React.ReactNode;
  params: Promise<{ certNumber: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { certNumber: raw } = await params;
  const certNumber = decodeURIComponent(raw).trim();
  return certificateShareMetadata(certNumber, certificateSharePageUrl(certNumber));
}

export default function ShareCertificateLayout({ children }: Props) {
  return children;
}
