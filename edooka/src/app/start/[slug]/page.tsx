"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { getProgramBySlug, type ProgramCard } from "@/data/programs";
import { ASSESSMENT_DURATION_LABEL, PASS_QUALIFY_COPY } from "@/lib/assessment-constants";
import { EDOOKA_ATTEMPT_KEY, persistLearnerProfile, type ActiveAttempt } from "@/lib/session-keys";

const schema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  phone: z
    .string()
    .min(10, "Enter a valid phone number")
    .regex(/^[\d\s+\-()]+$/, "Enter a valid phone number"),
});

type FormValues = z.infer<typeof schema>;

/**
 * Page: StartAssessment — lead capture; program details match library/assessments catalog.
 */
export default function StartAssessmentPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const router = useRouter();
  const [program, setProgram] = useState<ProgramCard | null>(() => getProgramBySlug(slug) ?? null);
  const [referredBy, setReferredBy] = useState("");

  useEffect(() => {
    fetch("/api/catalog/programs")
      .then((r) => r.json())
      .then((data: { programs?: ProgramCard[] }) => {
        const match = data.programs?.find((p) => p.slug === slug);
        if (match) setProgram(match);
      })
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setReferredBy(localStorage.getItem("edookaReferredBy") ?? "");
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "" },
  });

  if (!program) {
    return (
      <section className="mx-auto max-w-lg space-y-4 rounded-2xl border border-border-default bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Assessment not found</h1>
        <p className="text-text-secondary">This program slug is not in our catalog.</p>
        <Link href="/#assessments" className="font-semibold text-primary hover:underline">
          ← Back to assessments
        </Link>
      </section>
    );
  }

  function onSubmit(values: FormValues) {
    if (!program) return;
    const attemptId = crypto.randomUUID();
    const payload: ActiveAttempt = {
      attemptId,
      slug: program.slug,
      programTitle: program.title,
      programCategory: program.category,
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim(),
      startedAt: Date.now(),
      referredBy: referredBy || undefined,
    };
    sessionStorage.setItem(EDOOKA_ATTEMPT_KEY, JSON.stringify(payload));
    persistLearnerProfile(payload);
    router.push(`/quiz/${program.slug}`);
  }

  const durationLabel = program.durationLabel || ASSESSMENT_DURATION_LABEL;

  return (
    <section className="mx-auto w-full max-w-2xl space-y-6 sm:space-y-8">
      <article className="assessment-card flex min-h-[280px] flex-col rounded-2xl border border-border-default bg-white p-5 shadow-sm sm:min-h-[320px] sm:p-6">
        <div className="flex flex-1 flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Before you begin</p>
          <span className="mt-3 inline-block w-fit rounded-full bg-soft-orange px-3 py-0.5 text-xs font-semibold text-primary">
            {program.badge}
          </span>

          <div className="mt-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-soft-orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                stroke="#ff6b35"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="mt-3 text-xl font-extrabold leading-snug sm:text-2xl">{program.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary sm:text-base">{program.description}</p>
          <p className="mt-3 text-sm text-text-muted">
            {program.questions} questions · {durationLabel} · {PASS_QUALIFY_COPY}
          </p>
        </div>
      </article>

      <article className="rounded-2xl border border-border-default bg-white p-5 shadow-[0_12px_28px_rgba(255,149,88,0.18)] sm:p-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold">Full name</label>
          <input
            {...register("name")}
            className="mt-1 w-full rounded-xl border border-border-default px-4 py-2.5 outline-none focus:border-primary"
            autoComplete="name"
          />
          {errors.name ? <p className="mt-1 text-sm text-red-600">{errors.name.message}</p> : null}
        </div>
        <div>
          <label className="block text-sm font-semibold">Email</label>
          <input
            type="email"
            {...register("email")}
            className="mt-1 w-full rounded-xl border border-border-default px-4 py-2.5 outline-none focus:border-primary"
            autoComplete="email"
          />
          {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email.message}</p> : null}
        </div>
        <div>
          <label className="block text-sm font-semibold">Phone</label>
          <input
            {...register("phone")}
            className="mt-1 w-full rounded-xl border border-border-default px-4 py-2.5 outline-none focus:border-primary"
            autoComplete="tel"
          />
          {errors.phone ? <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p> : null}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-primary py-3 font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {isSubmitting ? "Starting…" : "Start assessment →"}
        </button>
      </form>
      </article>
    </section>
  );
}
