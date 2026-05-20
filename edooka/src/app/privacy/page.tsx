import { COMPANY_NAME } from "@/lib/site";

export default function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <h1 className="text-4xl font-extrabold tracking-tight mb-8">Privacy Policy</h1>
      <div className="prose prose-orange max-w-none text-text-secondary">
        <p>
          This Privacy Policy describes how Beverse Innovations ("we", "us", or "our"), operating as {COMPANY_NAME}, collects, uses, and shares your personal information. This policy is written specifically for our application to ensure compliance with the Digital Personal Data Protection (DPDP) Act, 2023.
        </p>

        <h2>1. Information We Collect</h2>
        <p>We collect the following specific information to provide our assessment and certification services:</p>
        <ul>
          <li><strong>Personal Details:</strong> Name, Email Address, Phone Number, Profession/Specialty.</li>
          <li><strong>Assessment Data:</strong> Quiz answers and performance metrics.</li>
          <li><strong>Transaction Data:</strong> Payment Order ID (we do not store full credit card details).</li>
        </ul>

        <h2>2. Why We Collect It</h2>
        <p>Your information is used strictly for:</p>
        <ul>
          <li>Generating and delivering your professional certificate.</li>
          <li>Verifying your credential when requested by third parties.</li>
          <li>Processing your payments securely.</li>
          <li>Sending important updates regarding your assessment or purchase.</li>
        </ul>

        <h2>3. Who We Share It With</h2>
        <p>We share your data only with trusted partners necessary to operate our service:</p>
        <ul>
          <li><strong>Cashfree:</strong> For secure payment processing.</li>
          <li><strong>Gmail (SMTP):</strong> For delivering your certificate via email when configured.</li>
          <li><strong>Interakt:</strong> For delivering your certificate via WhatsApp.</li>
          <li><strong>Neon / Cloudflare:</strong> For secure database hosting and global content delivery.</li>
        </ul>

        <h2>4. Data Retention Periods</h2>
        <ul>
          <li><strong>Certificates:</strong> Kept indefinitely to ensure your credential can always be verified by employers.</li>
          <li><strong>Payment Records:</strong> Stored for 8 years to comply with GST and tax regulations.</li>
        </ul>

        <h2>5. Your Rights (DPDP Act 2023)</h2>
        <p>
          Under the Digital Personal Data Protection Act, 2023, you have the right to access, correct, and request deletion of your personal data. You also have the right to nominate an individual to exercise these rights in the event of death or incapacity.
        </p>

        <h2>6. Grievance Officer</h2>
        <p>
          For any privacy-related concerns or to exercise your rights, please contact our Grievance Officer:
        </p>
        <p>
          <strong>Beverse Innovations</strong><br />
          Email: support@edooka.in<br />
        </p>
      </div>
    </div>
  );
}
