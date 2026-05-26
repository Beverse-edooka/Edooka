import type { Metadata } from "next";
import { getProgramBySlug } from "@/data/programs";
import { getAppOrigin } from "@/lib/app-url";

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const program = getProgramBySlug(slug);
  const origin = getAppOrigin();
  const title = program?.title ?? "Skill assessment";
  const description =
    program?.description ??
    "Take a free 15-minute healthcare skill assessment on Edooka. Earn a verifiable digital certificate.";
  const ogImage = `${origin}/api/og/assessment?slug=${encodeURIComponent(slug)}`;
  const pageUrl = `${origin}/start/${encodeURIComponent(slug)}`;

  return {
    title: `${title} | Edooka`,
    description,
    openGraph: {
      type: "website",
      url: pageUrl,
      siteName: "Edooka",
      title: `${title} — Edooka assessment`,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Edooka`,
      description,
      images: [ogImage],
    },
  };
}

export default function StartAssessmentLayout({ children }: Props) {
  return children;
}
