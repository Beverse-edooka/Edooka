import Link from "next/link";

/**
 * Component: Footer
 * Purpose: Shows legal links and company information in the global footer.
 * Used in: Root layout
 */
export function Footer() {
  return (
    <footer className="mt-12 border-t border-border-default py-8 text-sm text-text-muted">
      <p className="font-semibold text-text-primary">Edooka · Beverse Innovations Pvt. Ltd.</p>
      <p className="mt-1">Professional skill validation platform for modern careers.</p>
      <p className="mt-1">Email: support@edooka.in · GSTIN: placeholder</p>
      <div className="mt-3 flex flex-wrap gap-4">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/refund">Refund</Link>
        <Link href="/disclaimer">Disclaimer</Link>
      </div>
    </footer>
  );
}
