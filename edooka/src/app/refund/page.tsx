import { COMPANY_NAME } from "@/lib/site";

export default function RefundPolicy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <h1 className="text-4xl font-extrabold tracking-tight mb-8">Refund Policy</h1>
      
      <div className="rounded-xl border border-primary/30 bg-soft-orange px-6 py-4 mb-8">
        <h2 className="text-lg font-bold text-primary mb-2 mt-0">Refund Summary</h2>
        <p className="text-sm text-primary mb-0">Applicable for purchases of ₹218 (1 Certificate), ₹590 (3 Certificates), and ₹944 (6 Certificates).</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-xl border border-green-200 bg-green-50 p-6">
          <h3 className="text-lg font-bold text-green-700 flex items-center gap-2 mb-3">
            <span>✅</span> Eligible for Refund
          </h3>
          <ul className="text-sm text-green-800 space-y-2 list-disc pl-4">
            <li>Full refund requested within 7 days of purchase.</li>
            <li>AND the certificate PDF has NOT been downloaded or accessed.</li>
          </ul>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h3 className="text-lg font-bold text-red-700 flex items-center gap-2 mb-3">
            <span>❌</span> Not Eligible
          </h3>
          <ul className="text-sm text-red-800 space-y-2 list-disc pl-4">
            <li>Refunds requested after 7 days.</li>
            <li>Any bundle where at least one certificate PDF has been accessed.</li>
            <li>Partial refunds for unused bundle credits.</li>
          </ul>
        </div>
      </div>

      <div className="prose prose-orange max-w-none text-text-secondary">
        <h2>Key Rules</h2>
        <ul>
          <li><strong>Full Refund Condition:</strong> A full refund is only provided if you request it within 7 days of your purchase AND you have not downloaded the certificate PDF.</li>
          <li><strong>No Refund Once Accessed:</strong> Because our certificates are digital products, accessing or downloading the PDF constitutes full delivery. No refunds will be provided once the PDF is accessed.</li>
          <li><strong>Partial Bundles:</strong> Partial bundles are non-refundable. If you purchase a 3-certificate or 6-certificate bundle, you cannot request a refund for the unused portion.</li>
        </ul>

        <h2>4-Step Email Refund Process</h2>
        <p>To request an eligible refund, please follow these steps:</p>
        <ol>
          <li>Send an email to <strong>support@edooka.in</strong> from your registered email address.</li>
          <li>Subject line: "Refund Request - [Your Order ID]"</li>
          <li>Include the reason for your refund request.</li>
          <li>Our team will verify your PDF download status and process eligible refunds within 5-7 business days to your original payment method.</li>
        </ol>
      </div>
    </div>
  );
}
