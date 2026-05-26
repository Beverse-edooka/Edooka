import { redirect } from "next/navigation";

/** Share links use /assessments/{slug}; program detail lives at /assessment/{slug}. */
export default async function AssessmentsSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/assessment/${encodeURIComponent(slug)}`);
}
