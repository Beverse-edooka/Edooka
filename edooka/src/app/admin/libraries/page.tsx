"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";

type ProgramRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  durationMinutes: number;
  numQuestions: number;
  passThreshold: number;
  iconName: string | null;
  isActive: boolean;
};

const defaultForm = {
  id: "" as string | undefined,
  slug: "",
  title: "",
  description: "",
  category: "",
  durationMinutes: 15,
  numQuestions: 15,
  passThreshold: 50,
  iconName: "",
  isActive: true,
};

/**
 * Page: AdminLibraries — CRUD for assessment programs (library catalog).
 */
export default function AdminLibrariesPage() {
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/programs", { credentials: "include" });
      const data = (await res.json()) as { programs?: ProgramRow[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to load programs");
        setPrograms([]);
        return;
      }
      setPrograms(data.programs ?? []);
    } catch {
      setError("Network error");
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startCreate() {
    setForm({ ...defaultForm, id: undefined });
  }

  function startEdit(p: ProgramRow) {
    setForm({
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description ?? "",
      category: p.category,
      durationMinutes: p.durationMinutes,
      numQuestions: p.numQuestions,
      passThreshold: p.passThreshold,
      iconName: p.iconName ?? "",
      isActive: p.isActive,
    });
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const isEdit = Boolean(form.id);
      const res = await fetch("/api/admin/programs", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...(isEdit ? { id: form.id } : {}),
          slug: form.slug,
          title: form.title,
          description: form.description || null,
          category: form.category,
          durationMinutes: form.durationMinutes,
          numQuestions: form.numQuestions,
          passThreshold: form.passThreshold,
          iconName: form.iconName || null,
          isActive: form.isActive,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setForm(defaultForm);
      await load();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this program? All linked questions are removed too.")) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/programs?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Delete failed");
        return;
      }
      if (form.id === id) setForm(defaultForm);
      await load();
    } catch {
      setError("Network error");
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Libraries (programs)</h1>
        <button
          type="button"
          onClick={startCreate}
          className="rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-soft-orange"
        >
          New program
        </button>
      </div>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {loading ? (
        <p className="text-text-muted">Loading…</p>
      ) : programs.length === 0 && !form.slug ? (
        <p className="text-text-secondary">No programs yet. Use the form below to create one.</p>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border-default bg-white p-6 shadow-sm space-y-4"
      >
        <h2 className="text-xl font-bold">{form.id ? "Edit program" : "Add program"}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold mb-1">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl border border-border-default p-3 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Slug (URL)</label>
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="w-full rounded-xl border border-border-default p-3 focus:border-primary focus:outline-none"
              placeholder="e.g. physiotherapy"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Category</label>
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-xl border border-border-default p-3 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-border-default p-3 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Duration (minutes)</label>
            <input
              type="number"
              min={1}
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
              className="w-full rounded-xl border border-border-default p-3 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Questions count</label>
            <input
              type="number"
              min={1}
              value={form.numQuestions}
              onChange={(e) => setForm({ ...form, numQuestions: Number(e.target.value) })}
              className="w-full rounded-xl border border-border-default p-3 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Pass threshold (%)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={form.passThreshold}
              onChange={(e) => setForm({ ...form, passThreshold: Number(e.target.value) })}
              className="w-full rounded-xl border border-border-default p-3 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Icon name (optional)</label>
            <input
              value={form.iconName}
              onChange={(e) => setForm({ ...form, iconName: e.target.value })}
              className="w-full rounded-xl border border-border-default p-3 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              id="lib-active"
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-border-default"
            />
            <label htmlFor="lib-active" className="text-sm font-semibold">
              Active
            </label>
          </div>
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
          {form.id || form.slug ? (
            <button
              type="button"
              onClick={() => setForm(defaultForm)}
              className="rounded-xl border border-border-default px-6 py-2.5 font-semibold"
            >
              Clear form
            </button>
          ) : null}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-border-default bg-white p-6 shadow-sm"
      >
        <h2 className="text-xl font-bold mb-4">All programs ({programs.length})</h2>
        <div className="space-y-3">
          {programs.map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-3 rounded-xl border border-border-default p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      p.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {p.isActive ? "active" : "inactive"}
                  </span>
                  <span className="rounded-full bg-soft-orange px-2 py-0.5 text-xs font-semibold text-primary">
                    {p.category}
                  </span>
                </div>
                <p className="mt-2 font-bold text-foreground">{p.title}</p>
                <p className="text-sm text-text-muted">/{p.slug}</p>
                {p.description ? <p className="mt-2 text-sm text-text-secondary">{p.description}</p> : null}
                <p className="mt-2 text-xs text-text-muted">
                  {p.durationMinutes} min · {p.numQuestions} Q · pass {p.passThreshold}%
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(p)}
                  className="rounded-lg bg-soft-orange px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary hover:text-white"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void remove(p.id)}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
