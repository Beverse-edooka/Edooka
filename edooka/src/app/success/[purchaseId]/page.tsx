/**
 * Page: Success
 * Purpose: Displays payment success and certificate delivery info.
 */
export default async function SuccessPage({
  params,
}: {
  params: Promise<{ purchaseId: string }>;
}) {
  const { purchaseId } = await params;
  return <h1 className="text-2xl font-bold">Success scaffold: {purchaseId}</h1>;
}
