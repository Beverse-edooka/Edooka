/**
 * Page: StartAssessment
 * Purpose: Lead capture entry point before quiz starts.
 */
export default async function StartPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <h1 className="text-2xl font-bold">Start assessment: {slug}</h1>;
}
