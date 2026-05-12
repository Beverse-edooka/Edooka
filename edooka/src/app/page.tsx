import Link from "next/link";

/**
 * Page: HomePage
 * Purpose: Displays Edooka homepage with flow steps and trending library cards.
 */
export default function Home() {
  const steps = [
    { id: "1", title: "Do assessment", text: "Take a quick skill assessment in a guided flow." },
    { id: "2", title: "Pay", text: "Choose your plan and complete secure payment." },
    {
      id: "3",
      title: "Download and share certificate",
      text: "Get your certificate, download PDF, and share it instantly.",
    },
  ];

  const popularCourses = [
    "Diagnostic Lab Operations",
    "Nursing Administration",
    "Physiotherapy Leadership",
    "Radiology Workflow Essentials",
  ];

  return (
    <div className="space-y-12 py-8">
      <section className="space-y-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Skill validation for healthcare professionals
        </p>
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">
          Validate your skills. Get certified in 15 minutes.
        </h1>
        <Link
          href="/quiz/general"
          className="inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-white shadow-[0_8px_18px_rgba(255,107,53,0.35)] transition hover:-translate-y-0.5 hover:bg-primary-hover"
        >
          Start assessment
        </Link>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">3 steps</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <article
              key={step.id}
              className="card-hover animate-fade-up rounded-2xl border border-border-default bg-white p-5 shadow-[0_10px_24px_rgba(255,149,88,0.25)]"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <p className="text-3xl font-extrabold text-primary">{step.id}</p>
              <h3 className="mt-2 text-lg font-bold">{step.title}</h3>
              <p className="mt-2 text-sm text-text-secondary">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Trending courses</h2>
          <Link href="/library" className="text-sm font-semibold text-primary hover:underline">
            View more
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popularCourses.map((course, index) => (
            <article
              key={course}
              className="card-hover floating-card rounded-2xl border border-primary/20 bg-gradient-to-b from-white to-soft-orange p-4"
              style={{ animationDelay: `${index * 180}ms` }}
            >
              <p className="text-sm font-semibold text-primary">Popular</p>
              <h3 className="mt-2 text-base font-bold">{course}</h3>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
