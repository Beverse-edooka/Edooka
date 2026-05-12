/**
 * Layout: AdminLayout
 * Purpose: Shared layout wrapper for protected admin pages.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}
