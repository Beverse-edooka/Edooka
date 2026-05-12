/**
 * Page: Verify
 * Purpose: Public certificate verification lookup page.
 */
export default async function VerifyPage({
  params,
}: {
  params: Promise<{ certNumber: string }>;
}) {
  const { certNumber } = await params;
  return <h1 className="text-2xl font-bold">Verify scaffold: {certNumber}</h1>;
}
