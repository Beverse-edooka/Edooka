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
      <section className="quiz-shell space-y-4 rounded-2xl border border-border-default bg-white p-8 shadow-sm">
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
    <section className="quiz-shell space-y-6 rounded-2xl border border-border-default bg-white p-6 shadow-[0_12px_28px_rgba(255,149,88,0.18)] sm:space-y-8 sm:p-8">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Before you begin</p>
        <h1 className="text-xl font-extrabold sm:text-2xl">{program.title}</h1>
        <p className="text-sm leading-relaxed text-text-secondary">{program.description}</p>
        <p className="text-xs text-text-muted">
          {program.questions} questions · {durationLabel} · {PASS_QUALIFY_COPY}
        </p>
      </div>

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
    </section>
  );
}
