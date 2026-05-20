"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";

type ProgramRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
};

type QuestionRow = {
  id: string;
  programId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  rationale: string | null;
  orderIndex: number | null;
  programTitle: string;
  programSlug: string;
};

const defaultForm = {
  id: "" as string | undefined,
  programId: "",
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctOption: "a",
  rationale: "",
  orderIndex: "" as number | "",
};

/**
 * Page: AdminQuestions — list and CRUD all exam questions (per program).
 */
export default function AdminQuestionsPage() {
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [filterProgramId, setFilterProgramId] = useState("");
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadPrograms = useCallback(async () => {
    const res = await fetch("/api/admin/programs", { credentials: "include" });
    const data = (await res.json()) as { programs?: ProgramRow[] };
    if (res.ok) setPrograms(data.programs ?? []);
  }, []);

  const loadQuestions = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const q = filterProgramId
        ? `/api/admin/questions?programId=${encodeURIComponent(filterProgramId)}`
        : "/api/admin/questions";
      const res = await fetch(q, { credentials: "include" });
      const data = (await res.json()) as { questions?: QuestionRow[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to load questions");
        setQuestions([]);
        return;
      }
      setQuestions(data.questions ?? []);
    } catch {
      setError("Network error");
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [filterProgramId]);

  useEffect(() => {
    void loadPrograms();
  }, [loadPrograms]);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  function startCreate() {
    setForm({
      ...defaultForm,
      id: undefined,
      programId: filterProgramId || programs[0]?.id || "",
    });
  }

  function startEdit(q: QuestionRow) {
    setForm({
      id: q.id,
      programId: q.programId,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctOption: (q.correctOption || "a").toLowerCase().slice(0, 1),
      rationale: q.rationale ?? "",
      orderIndex: q.orderIndex ?? "",
    });
  }

  async function save() {
    if (!form.programId) {
      setError("Select a program");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const isEdit = Boolean(form.id);
      const res = await fetch("/api/admin/questions", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...(isEdit ? { id: form.id } : {}),
          programId: form.programId,
          questionText: form.questionText,
          optionA: form.optionA,
          optionB: form.optionB,
          optionC: form.optionC,
          optionD: form.optionD,
          correctOption: form.correctOption,
          rationale: form.rationale || null,
          orderIndex: form.orderIndex === "" ? null : Number(form.orderIndex),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setForm({ ...defaultForm, programId: form.programId });
      await loadQuestions();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this question?")) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/questions?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Delete failed");
        return;
      }
      if (form.id === id) setForm({ ...defaultForm, programId: filterProgramId || programs[0]?.id || "" });
      await loadQuestions();
    } catch {
      setError("Network error");
    }
  }

  return (
    <section className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Questions</h1>
        <button
          type="button"
          onClick={startCreate}
          className="rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-soft-orange"
        >
          New question
        </button>
      </div>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold">Filter by program</label>
        <select
          value={filterProgramId}
          onChange={(e) => setFilterProgramId(e.target.value)}
          className="rounded-xl border border-border-default px-3 py-2 text-sm"
        >
          <option value="">All programs</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border-default bg-white p-6 shadow-sm space-y-4"
      >
        <h2 className="text-xl font-bold">{form.id ? "Edit question" : "Add question"}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Program</label>
            <select
              value={form.programId}
              onChange={(e) => setForm({ ...form, programId: e.target.value })}
              className="w-full rounded-xl border border-border-default p-3 focus:border-primary focus:outline-none"
            >
              <option value="">Select…</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.slug})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Question</label>
            <textarea
              value={form.questionText}
              onChange={(e) => setForm({ ...form, questionText: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-border-default p-3 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["A", "B", "C", "D"] as const).map((L) => {
              const key = `option${L}` as "optionA" | "optionB" | "optionC" | "optionD";
              return (
                <div key={L}>
                  <label className="block text-sm font-semibold mb-1">Option {L}</label>
                  <input
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full rounded-xl border border-border-default p-3 focus:border-primary focus:outline-none"
                  />
                </div>
              );
            })}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold mb-1">Correct option</label>
              <select
                value={form.correctOption}
                onChange={(e) => setForm({ ...form, correctOption: e.target.value })}
                className="w-full rounded-xl border border-border-default p-3 focus:border-primary focus:outline-none"
              >
                <option value="a">A</option>
                <option value="b">B</option>
                <option value="c">C</option>
                <option value="d">D</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Order index (optional)</label>
              <input
                type="number"
                value={form.orderIndex}
                onChange={(e) =>
                  setForm({ ...form, orderIndex: e.target.value === "" ? "" : Number(e.target.value) })
                }
                className="w-full rounded-xl border border-border-default p-3 focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Rationale (optional)</label>
            <textarea
              value={form.rationale}
              onChange={(e) => setForm({ ...form, rationale: e.target.value })}
              rows={2}
              className="w-full rounded-xl border border-border-default p-3 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              disabled={saving}
              onClick={() => void save()}
              className="rounded-xl bg-primary px-6 py-2.5 font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {saving ? "Saving…" : form.id ? "Update" : "Create"}
            </motion.button>
            <button
              type="button"
              onClick={() => setForm({ ...defaultForm, programId: filterProgramId || programs[0]?.id || "" })}
              className="rounded-xl border border-border-default px-6 py-2.5 font-semibold"
            >
              Clear form
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-border-default bg-white p-6 shadow-sm"
      >
        <h2 className="text-xl font-bold mb-4">
          All questions ({questions.length}
          {filterProgramId ? ", filtered" : ""})
        </h2>
        {loading ? (
          <p className="text-text-muted">Loading…</p>
        ) : questions.length === 0 ? (
          <p className="text-text-secondary">No questions yet. Create programs first, then add questions.</p>
        ) : (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {questions.map((q) => (
              <div
                key={q.id}
                className="rounded-xl border border-border-default p-4 flex flex-col gap-3 lg:flex-row lg:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {q.programTitle} · /{q.programSlug}
                  </p>
                  <p className="mt-2 font-semibold text-foreground">{q.questionText}</p>
                  <div className="mt-2 grid gap-1 text-sm text-text-secondary sm:grid-cols-2">
                    <span className={q.correctOption?.toLowerCase() === "a" ? "font-bold text-primary" : ""}>
                      A. {q.optionA}
                    </span>
                    <span className={q.correctOption?.toLowerCase() === "b" ? "font-bold text-primary" : ""}>
                      B. {q.optionB}
                    </span>
                    <span className={q.correctOption?.toLowerCase() === "c" ? "font-bold text-primary" : ""}>
                      C. {q.optionC}
                    </span>
                    <span className={q.correctOption?.toLowerCase() === "d" ? "font-bold text-primary" : ""}>
                      D. {q.optionD}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(q)}
                    className="rounded-lg bg-soft-orange px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary hover:text-white"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(q.id)}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
}
