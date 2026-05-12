/**
 * Page: Library
 * Purpose: Displays full course library with trending cards.
 */
export default function LibraryPage() {
  const courses = [
    "Diagnostic Lab Operations",
    "Nursing Administration",
    "Physiotherapy Leadership",
    "Radiology Workflow Essentials",
    "Healthcare Sales Foundations",
    "Ward Documentation Excellence",
    "Patient Communication Systems",
    "Quality Assurance Basics",
  ];

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">Course Library</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {courses.map((course) => (
          <article
            key={course}
            className="card-hover floating-card rounded-2xl border border-primary/20 bg-gradient-to-b from-white to-soft-orange p-4"
          >
            <p className="text-sm font-semibold text-primary">Library</p>
            <h2 className="mt-2 text-base font-bold">{course}</h2>
          </article>
        ))}
      </div>
    </section>
  );
}
