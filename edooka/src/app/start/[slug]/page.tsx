"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMemo } from "react";
import { getProgramBySlug } from "@/data/programs";
import { useParams } from "next/navigation";
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
 * Page: StartAssessment
 * Purpose: Lead capture before the timed quiz (name, email, phone).
 */
export default function StartAssessmentPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const router = useRouter();
  const program = useMemo(() => getProgramBySlug(slug), [slug]);

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
    };
    sessionStorage.setItem(EDOOKA_ATTEMPT_KEY, JSON.stringify(payload));
    persistLearnerProfile(payload);
    router.push(`/quiz/${program.slug}`);
  }

  return (
    <section className="mx-auto max-w-lg space-y-8 rounded-2xl border border-border-default bg-white p-8 shadow-[0_12px_28px_rgba(255,149,88,0.18)]">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Before you begin</p>
        <h1 className="text-2xl font-extrabold">{program.title}</h1>
        <p className="text-sm text-text-secondary">
          Enter your details to receive your certificate and payment confirmation by email.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-foreground">Full name</label>
          <input
            {...register("name")}
            autoComplete="name"
            className="mt-1 w-full rounded-xl border border-border-default px-4 py-3 text-foreground outline-none focus:border-primary"
            placeholder="As it should appear on the certificate"
          />
          {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground">Email</label>
          <input
            {...register("email")}
            type="email"
            autoComplete="email"
            className="mt-1 w-full rounded-xl border border-border-default px-4 py-3 outline-none focus:border-primary"
            placeholder="you@hospital.org"
          />
          {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground">Phone</label>
          <input
            {...register("phone")}
            type="tel"
            autoComplete="tel"
            className="mt-1 w-full rounded-xl border border-border-default px-4 py-3 outline-none focus:border-primary"
            placeholder="+91 ..."
          />
          {errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p> : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-primary py-3 font-semibold text-white shadow hover:bg-primary-hover disabled:opacity-60 transition-colors"
        >
          Continue to assessment →
        </button>
      </form>

      <p className="text-center text-xs text-text-muted">
        {program.questions} questions · {program.durationLabel} · 50% to qualify
      </p>
    </section>
  );
}
