"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { motion } from "framer-motion";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      router.replace(nextPath.startsWith("/admin") ? nextPath : "/admin");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-md space-y-6 rounded-2xl border border-border-default bg-white p-8 shadow-sm"
    >
      <h1 className="text-2xl font-extrabold">Admin sign-in</h1>

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold">Email</label>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border-default px-4 py-2.5 outline-none focus:border-primary"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold">Password</label>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border-default px-4 py-2.5 outline-none focus:border-primary"
            required
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary py-3 font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </motion.section>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<p className="text-center text-text-muted py-12">Loading…</p>}>
      <AdminLoginForm />
    </Suspense>
  );
}
