"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { buildQuestionPool, selectAttemptQuestions } from "@/lib/assessment";

/**
 * Page: Quiz
 * Purpose: Runs one-question-per-screen assessment with random 18 questions.
 */
export default function QuizPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "assessment";
  const questions = useMemo(() => selectAttemptQuestions(buildQuestionPool(), 18), []);
  const attemptId = useMemo(
    () => `${slug}-${questions[0]?.id ?? "Q1"}-${questions[questions.length - 1]?.id ?? "Q18"}`,
    [questions, slug],
  );
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);

  const current = questions[index];
  const progress = ((index + 1) / questions.length) * 100;

  function handleAnswer(selectedIndex: number) {
    const nextScore = score + (selectedIndex === current.correctIndex ? 1 : 0);
    const isLast = index === questions.length - 1;

    if (isLast) {
      router.push(`/result/${attemptId}?score=${nextScore}&total=${questions.length}`);
      return;
    }

    setScore(nextScore);
    setIndex((prev) => prev + 1);
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-border-default bg-white p-6 shadow-[0_10px_28px_rgba(255,149,88,0.22)]">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">Assessment: {slug}</p>
        <p className="font-semibold">
          Question {index + 1} of {questions.length}
        </p>
      </div>

      <div className="h-2 w-full rounded-full bg-soft-orange">
        <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>

      <h1 className="text-2xl font-bold">{current.questionText}</h1>

      <div className="grid gap-3">
        {current.options.map((option, optionIndex) => (
          <button
            key={option}
            type="button"
            onClick={() => handleAnswer(optionIndex)}
            className="card-hover rounded-xl border border-border-default bg-white p-4 text-left transition"
          >
            <span className="mr-2 font-bold text-primary">{String.fromCharCode(65 + optionIndex)}.</span>
            {option}
          </button>
        ))}
      </div>
    </section>
  );
}
