import Link from "next/link";

/**
 * Component: Nav
 * Purpose: Renders the top navigation used across all public pages.
 * Used in: Root layout
 */
export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border-default bg-background/90 py-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">
            e
          </span>
          <span className="text-lg font-bold tracking-tight">edooka</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/library" className="hover:text-primary">
            Library
          </Link>
          <Link href="/certificate" className="hover:text-primary">
            Certificate
          </Link>
        </nav>
      </div>
    </header>
  );
}
