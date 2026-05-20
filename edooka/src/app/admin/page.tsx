import Link from "next/link";

/**
 * Page: AdminDashboard
 * Purpose: Entry dashboard for admin metrics and quick links.
 */
export default function AdminPage() {
  return (
    <section className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Admin dashboard</h1>
        <p className="mt-2 text-text-secondary max-w-2xl">
          Manage assessment libraries and exam questions. Changes sync to the catalog when the database or local
          admin file is connected.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/questions"
          className="rounded-2xl border border-border-default bg-white p-6 shadow-sm assessment-card"
        >
          <h2 className="text-lg font-bold">Questions CRUD</h2>
          <p className="mt-2 text-sm text-text-secondary">Add, edit, and delete exam questions per program.</p>
        </Link>
        <Link
          href="/admin/libraries"
          className="rounded-2xl border border-border-default bg-white p-6 shadow-sm assessment-card"
        >
          <h2 className="text-lg font-bold">Libraries CRUD</h2>
          <p className="mt-2 text-sm text-text-secondary">Create specialties and categories shown on the site.</p>
        </Link>
      </div>
    </section>
  );
}
