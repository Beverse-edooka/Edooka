import Link from "next/link";

/**
 * Component: Footer — Edooka branding, about, explore links, copyright.
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
              <span className="text-lg font-bold tracking-tight text-foreground">Edooka</span>
            </div>
            <p className="text-sm text-text-muted">support@edooka.in</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary">About Edooka</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Edooka helps healthcare professionals validate specialty skills with short assessments and verifiable
              digital credentials you can share on LinkedIn, your resume, and with employers.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Explore</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/#assessments"
                  className="text-text-secondary hover:text-primary font-medium transition-colors"
                >
                  Assessments
                </Link>
              </li>
              <li>
                <Link href="/library" className="text-text-secondary hover:text-primary font-medium transition-colors">
                  Certificate library
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/login"
                  className="text-text-secondary hover:text-primary font-medium transition-colors"
                >
                  Admin login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border-default pt-6 text-center text-xs text-text-muted">
          <p>© {year} Edooka. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
