import Link from "next/link";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

/**
 * Layout: AdminLayout — full-width admin shell aligned with the public site.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full space-y-6">
      <header className="flex flex-col gap-4 border-b border-border-default pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
          <Link href="/admin" className="font-bold text-foreground hover:text-primary">
            Admin
          </Link>
          <span className="text-text-muted">/</span>
          <Link href="/admin/libraries" className="hover:text-primary">
            Libraries
          </Link>
          <Link href="/admin/questions" className="hover:text-primary">
            Questions
          </Link>
        </div>
        <AdminLogoutButton />
      </header>
      <div className="w-full">{children}</div>
    </div>
  );
}
