import Link from "next/link";
import { SocialIcons } from "@/components/layout/SocialIcons";
import { COMPANY_ADDRESS, COMPANY_NAME, SUPPORT_EMAIL } from "@/lib/site";

/**
 * Component: Footer — edooka branding, about, legal links, copyright.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-border-default bg-soft-orange/40">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">
                e
              </span>
              <span className="text-lg font-bold tracking-tight text-foreground">{COMPANY_NAME}</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{COMPANY_ADDRESS}</p>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm text-text-muted hover:text-primary transition-colors">
              {SUPPORT_EMAIL}
            </a>
            <SocialIcons />
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary">About {COMPANY_NAME}</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              {COMPANY_NAME} helps healthcare professionals validate specialty skills with short assessments and
              verifiable digital credentials you can share on LinkedIn, your resume, and with employers.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Legal</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-text-secondary hover:text-primary font-medium transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund" className="text-text-secondary hover:text-primary font-medium transition-colors">
                  Refund Scheme
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border-default pt-6 text-center text-xs text-text-muted">
          <p>© {year} {COMPANY_NAME}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
