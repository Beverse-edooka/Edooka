import Link from "next/link";

/**
 * Page: AdminDashboard
 * Purpose: Entry dashboard for admin metrics and quick links.
 */
export default function AdminPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Admin dashboard</h1>
      <p className="text-text-secondary">Manage questions and libraries from these modules.</p>
      <div className="flex gap-3">
        <Link href="/admin/questions" className="rounded-xl bg-primary px-4 py-2 font-semibold text-white">
          Questions CRUD
        </Link>
        <Link href="/admin/libraries" className="rounded-xl border border-border-default px-4 py-2">
          Libraries CRUD
        </Link>
      </div>
    </section>
  );
}
