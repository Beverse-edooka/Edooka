"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { AssessmentQuestion } from "@/lib/assessment";
import { getProgramBySlug } from "@/data/programs";
import { normalizeLearnerAttempt } from "@/lib/learner";
import { EDOOKA_ATTEMPT_KEY, persistLearnerProfile, type ActiveAttempt } from "@/lib/session-keys";

const QUESTION_TIME_LIMIT = 60;

type QuizProgramPayload = {
  slug: string;
  title: string;
  category: string;
  numQuestions: number;
  passThreshold: number;
};

type QuizApiOk = {
  program: QuizProgramPayload;
  questions: AssessmentQuestion[];
};

type QuizApiErr = {
  error: string;
  program?: { slug: string; title: string; category: string };
};

/**
 * Page: Quiz
 * Purpose: Timed assessment from admin-authored DB questions; requires /start/[slug].
 */
export default function QuizPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "general";
  const staticProgram = getProgramBySlug(slug);

  const [attempt, setAttempt] = useState<ActiveAttempt | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [quizProgram, setQuizProgram] = useState<QuizProgramPayload | null>(null);
  const [quizLoading, setQuizLoading] = useState(true);
  const [quizLoadError, setQuizLoadError] = useState<string | null>(null);
  const [quizErrProgram, setQuizErrProgram] = useState<QuizApiErr["program"] | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem(EDOOKA_ATTEMPT_KEY);
    if (!raw) {
      setBootError("missing");
      return;
    }
    try {
      const data = JSON.parse(raw) as ActiveAttempt;
      if (data.slug !== slug) {
        setBootError("slug");
        return;
      }
      const enriched = normalizeLearnerAttempt(data);
      setAttempt(enriched);
      sessionStorage.setItem(EDOOKA_ATTEMPT_KEY, JSON.stringify(enriched));
      persistLearnerProfile(enriched);
    } catch {
      setBootError("parse");
    }
  }, [slug]);

  useEffect(() => {
    if (!bootError || bootError === "slug") return;
    router.replace(`/start/${slug}`);
  }, [bootError, router, slug]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      setQuizLoading(true);
      setQuizLoadError(null);
      setQuizErrProgram(null);
      try {
        const r = await fetch(`/api/quiz/questions?slug=${encodeURIComponent(slug)}`);
        const data = (await r.json()) as QuizApiOk & QuizApiErr;
        if (cancelled) return;
        if (!r.ok) {
          setQuizLoadError(data.error ?? "load_failed");
          setQuizErrProgram("program" in data && data.program ? data.program : null);
          setQuestions([]);
          setQuizProgram(null);
          return;
        }
        setQuestions(data.questions ?? []);
        setQuizProgram(data.program ?? null);
      } catch {
        if (!cancelled) {
          setQuizLoadError("load_failed");
          setQuestions([]);
          setQuizProgram(null);
        }
      } finally {
        if (!cancelled) setQuizLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const attemptId = attempt?.attemptId ?? "";

  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [answered, setAnswered] = useState(false);

  const current = questions[index];
  const progress = questions.length > 0 ? ((index + 1) / questions.length) * 100 : 0;

  const moveNext = useCallback(
    (currentScore: number) => {
      const passThreshold = quizProgram?.passThreshold ?? 50;
      const isLast = index === questions.length - 1;
      if (isLast) {
        router.push(
          `/result/${attemptId}?score=${currentScore}&total=${questions.length}&slug=${encodeURIComponent(slug)}&passThreshold=${passThreshold}`
        );
        return;
      }
      setIndex((prev) => prev + 1);
      setTimeLeft(QUESTION_TIME_LIMIT);
      setAnswered(false);
    },
    [index, questions.length, attemptId, router, slug, quizProgram?.passThreshold]
  );

  useEffect(() => {
    if (answered) return;
    if (timeLeft === 0) {
      moveNext(score);
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, answered, score, moveNext]);

  function handleAnswer(selectedIndex: number) {
    if (answered || !current) return;
    const nextScore = score + (selectedIndex === current.correctIndex ? 1 : 0);
    setScore(nextScore);
    setAnswered(true);
    setTimeout(() => moveNext(nextScore), 400);
  }

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference - (timeLeft / QUESTION_TIME_LIMIT) * circumference;
  const timerColor =
    timeLeft > 20 ? "#ff6b35" : timeLeft > 10 ? "#f59e0b" : "#ef4444";

  if (bootError === "slug") {
    return (
      <section className="mx-auto max-w-lg rounded-2xl border border-border-default bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold">Wrong assessment session</h1>
        <p className="mt-2 text-text-secondary">Start again from your selected program.</p>
        <Link href={`/start/${slug}`} className="mt-4 inline-block font-semibold text-primary">
          Enter details →
        </Link>
      </section>
    );
  }

  if (!attempt) {
    return (
      <section className="mx-auto max-w-lg rounded-2xl border border-border-default bg-white p-8 text-center">
        <p className="text-text-muted">Loading assessment…</p>
      </section>
    );
  }

  if (quizLoading) {
    return (
      <section className="mx-auto max-w-lg rounded-2xl border border-border-default bg-white p-8 text-center">
        <p className="text-text-muted">Loading exam questions…</p>
      </section>
    );
  }

  if (quizLoadError) {
    const title =
      quizErrProgram?.title ?? staticProgram?.title ?? "This assessment";
    return (
      <section className="mx-auto max-w-lg space-y-4 rounded-2xl border border-border-default bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold">
          {quizLoadError === "no_questions" ? "Questions not ready yet" : "Assessment unavailable"}
        </h1>
        <p className="text-text-secondary">
          {quizLoadError === "no_questions" && (
            <>
              {title} does not have published exam questions yet. Add questions in Admin, then try again.
            </>
          )}
          {quizLoadError === "program_not_found" && (
            <>This program is not available in the exam catalog. Check the link or return to assessments.</>
          )}
          {(quizLoadError === "load_failed" || quizLoadError === "slug_required") && (
            <>Could not load exam questions. Check your connection and database configuration, then try again.</>
          )}
        </p>
        <Link href="/#assessments" className="inline-block font-semibold text-primary">
          ← Back to assessments
        </Link>
      </section>
    );
  }

  if (!quizProgram || questions.length === 0 || !current) {
    return (
      <section className="mx-auto max-w-lg rounded-2xl border border-border-default bg-white p-8 text-center space-y-4">
        <h1 className="text-xl font-bold">Could not start exam</h1>
        <p className="text-text-secondary text-sm">No questions were returned for this program.</p>
        <Link href="/#assessments" className="font-semibold text-primary">
          ← Assessments
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-lg flex-col gap-3 rounded-2xl border border-border-default bg-white p-5 shadow-[0_12px_28px_rgba(255,149,88,0.18)] sm:gap-4 sm:p-6">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{quizProgram.title}</p>
          <p className="text-xs text-text-muted capitalize">{quizProgram.category}</p>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-5 sm:gap-6">
          <div className="flex flex-col items-center">
            <div className="relative h-14 w-14 shrink-0">
              <svg
                width="56"
                height="56"
                viewBox="0 0 56 56"
                className="-rotate-90 absolute inset-0"
                aria-hidden
              >
                <circle cx="28" cy="28" r={radius} fill="none" stroke="#fff5ef" strokeWidth="4" />
                <circle
                  cx="28"
                  cy="28"
                  r={radius}
                  fill="none"
                  stroke={timerColor}
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDash}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s" }}
                />
              </svg>
              <span
                className="absolute inset-0 flex items-center justify-center font-bold tabular-nums text-[11px] leading-none"
                style={{ color: timerColor }}
              >
                {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
                {String(timeLeft % 60).padStart(2, "0")}
              </span>
            </div>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              Time left
            </span>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Question</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">
              {index + 1} <span className="text-text-muted font-semibold">/</span> {questions.length}
            </p>
          </div>
        </div>
      </div>

      <div className="h-2 w-full rounded-full bg-soft-orange">
        <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>

      <h1 className="shrink-0 text-base font-bold leading-snug line-clamp-4 sm:text-lg md:text-xl">
        {current.questionText}
      </h1>

      <div className="min-h-0 flex-1 overflow-y-auto px-1 pt-2 pb-3 -mx-1">
        <div className="grid gap-2 sm:gap-3">
        {current.options.map((option, optionIndex) => (
          <button
            key={`${current.id}-${optionIndex}`}
            type="button"
            onClick={() => handleAnswer(optionIndex)}
            disabled={answered}
            className="card-hover rounded-xl border border-border-default bg-white p-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-60 sm:p-3.5 sm:text-base"
          >
            <span className="mr-2 font-bold text-primary">{String.fromCharCode(65 + optionIndex)}.</span>
            {option}
          </button>
        ))}
        </div>
      </div>

      <p className="shrink-0 text-center text-[10px] text-text-muted sm:text-xs">
        Each question has a 1-minute time limit. Unanswered questions are skipped automatically.
      </p>
    </section>
  );
}
