import { COMPANY_NAME } from "@/lib/site";

export default function TermsConditions() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <h1 className="text-4xl font-extrabold tracking-tight mb-8">Terms & Conditions</h1>
      <div className="prose prose-orange max-w-none text-text-secondary">
        <p>
          Welcome to {COMPANY_NAME}. These Terms & Conditions outline the rules and regulations for the use of our assessment and certification platform.
        </p>

        <h2>1. Assessment Rules</h2>
        <ul>
          <li><strong>Passing Threshold:</strong> A minimum score of 50% is required to pass any assessment and unlock the certification.</li>
          <li><strong>Retries:</strong> If you do not pass, you must wait 24 hours before attempting the same assessment again.</li>
          <li><strong>Question Randomization:</strong> Assessment questions are randomized for each attempt to maintain the integrity of the evaluation.</li>
        </ul>

        <h2>2. Certification Nature</h2>
        <p>
          The certificates provided by {COMPANY_NAME} are intended to validate your knowledge and skills in specific healthcare domains. <strong>Important Note:</strong> Our certificates do NOT qualify as Continuing Professional Development (CPD) or Continuing Medical Education (CME) credits unless explicitly stated otherwise on the specific program.
        </p>

        <h2>3. Bundle Credits</h2>
        <p>
          If you purchase a bundle of certificates (e.g., 3 or 6 certificates), the credits added to your account <strong>never expire</strong>. You can use them to unlock certificates for passed assessments at any time in the future.
        </p>

        <h2>4. Prohibited Conduct</h2>
        <p>To maintain the integrity of our platform, the following actions are strictly prohibited:</p>
        <ul>
          <li>Sharing, distributing, or publishing assessment questions or answers.</li>
          <li>Using bots, automated scripts, or unauthorized tools to complete assessments.</li>
          <li>Impersonating another individual or creating multiple accounts to circumvent retry limits.</li>
          <li>Attempting to reverse-engineer or manipulate the certification generation process.</li>
        </ul>
        <p>Violation of these rules may result in the immediate revocation of your certificates and permanent ban from the platform without refund.</p>
        
        <h2>5. Changes to Terms</h2>
        <p>
          We reserve the right to modify these terms at any time. We will notify users of significant changes, but it is your responsibility to review these terms periodically.
        </p>
      </div>
    </div>
  );
}
