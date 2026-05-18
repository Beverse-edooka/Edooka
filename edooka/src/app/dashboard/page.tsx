"use client";

import { useState } from "react";
import Link from "next/link";

type CertRow = {
  id: string;
  certificateNumber: string;
  pdfUrl: string;
  verificationUrl: string;
  issuedAt: string;
  programTitle: string;
  programSlug: string;
  programCategory: string;
};

type DashData = {
  found: boolean;
  name?: string;
  email?: string;
  certs: CertRow[];
  credits: number;
};

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    setSelected(new Set());

    try {
      const res = await fetch(`/api/dashboard?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      const json = await res.json();
      setData(json);
      if (json.found && json.certs.length > 0) {
        setSelected(new Set(json.certs.map((c: CertRow) => c.certificateNumber)));
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function toggleCert(certNumber: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(certNumber) ? next.delete(certNumber) : next.add(certNumber);
      return next;
    });
  }

  async function handleBundleDownload() {
    if (selected.size === 0 || !data?.email) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/certificate/bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          certNumbers: Array.from(selected),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Download failed");
        return;
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `Edooka-Certificates-${data.name?.replace(/\s+/g, "-")}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Bundle download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-[680px] mx-auto">
        <div className="text-center mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted mb-3 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            My Edooka
          </p>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
            Access your certificates
          </h1>
          <p className="text-text-secondary text-[14px]">
            Enter the email you used when taking your assessment.
          </p>
        </div>

        {!data && (
          <form onSubmit={handleLookup} className="bg-white border border-border-default rounded-2xl p-8 shadow-sm">
            <label className="block text-sm font-semibold text-foreground mb-2">
              Your email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full border border-border-default rounded-lg px-4 py-3 text-sm text-foreground bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary mb-4 transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-bold text-sm shadow-sm hover:bg-primary-hover disabled:opacity-60 transition-all"
            >
              {loading ? "Looking up…" : "Find my certificates"}
            </button>
            {error && (
              <p className="mt-3 text-sm font-medium text-red-600 text-center">{error}</p>
            )}
          </form>
        )}

        {data && !data.found && (
          <div className="text-center bg-white border border-border-default rounded-2xl p-10 shadow-sm">
            <p className="text-[48px] mb-4">🔍</p>
            <h2 className="text-xl font-bold text-foreground mb-2">No account found</h2>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              We couldn't find any certificates for <strong>{email}</strong>.<br/>
              Make sure you're using the same email you entered when you started your assessment.
            </p>
            <button
              onClick={() => { setData(null); setEmail(""); }}
              className="text-primary font-bold text-sm hover:underline transition-all"
            >
              Try a different email
            </button>
          </div>
        )}

        {data && data.found && (
          <div className="space-y-6">
            <div className="bg-white border border-border-default rounded-2xl px-6 py-5 flex items-center justify-between flex-wrap gap-3 shadow-sm">
              <div>
                <p className="font-bold text-foreground text-lg">Welcome back, {data.name?.split(" ")[0]}</p>
                <p className="text-text-muted text-sm mt-0.5">{data.email}</p>
              </div>
              <div className="flex items-center gap-4">
                {data.credits > 0 && (
                  <div className="bg-soft-orange rounded-xl px-4 py-2.5 text-center border border-primary/20">
                    <p className="text-2xl font-extrabold text-primary leading-none">{data.credits}</p>
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">
                      credit{data.credits !== 1 ? "s" : ""} left
                    </p>
                  </div>
                )}
                <button
                  onClick={() => { setData(null); setEmail(""); }}
                  className="text-xs font-semibold text-text-muted hover:text-foreground transition-all underline underline-offset-2"
                >
                  Change email
                </button>
              </div>
            </div>

            {data.credits > 0 && (
              <div className="bg-soft-orange border border-primary/30 rounded-2xl px-6 py-5 flex items-center justify-between gap-4 flex-wrap shadow-sm">
                <div>
                  <p className="font-bold text-foreground text-base">
                    You have {data.credits} unused bundle credit{data.credits !== 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-text-secondary mt-1">
                    Use them on any assessment in the catalog — they never expire.
                  </p>
                </div>
                <Link
                  href="/#assessments"
                  className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-primary-hover transition-all whitespace-nowrap"
                >
                  Browse assessments →
                </Link>
              </div>
            )}

            {data.certs.length === 0 ? (
              <div className="text-center bg-white border border-border-default rounded-2xl p-10 shadow-sm">
                <p className="text-[40px] mb-3">📋</p>
                <h2 className="text-lg font-bold text-foreground mb-2">No certificates yet</h2>
                <p className="text-text-secondary text-sm mb-6">
                  Complete and pass an assessment to earn your first certificate.
                </p>
                <Link
                  href="/#assessments"
                  className="inline-block bg-primary text-white px-6 py-3 rounded-lg text-sm font-bold shadow-sm hover:bg-primary-hover transition-all"
                >
                  Start an assessment
                </Link>
              </div>
            ) : (
              <>
                <div className="bg-white border border-border-default rounded-2xl px-6 py-5 flex items-center justify-between gap-4 flex-wrap shadow-sm">
                  <div>
                    <p className="font-bold text-foreground text-base">
                      Download selected ({selected.size} of {data.certs.length})
                    </p>
                    <p className="text-xs font-medium text-text-muted mt-1">
                      Select certificates below and download all as a single ZIP
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => setSelected(new Set(data.certs.map((c) => c.certificateNumber)))}
                      className="text-xs font-bold text-primary hover:underline transition-all"
                    >
                      Select all
                    </button>
                    <span className="text-border-default">|</span>
                    <button
                      onClick={() => setSelected(new Set())}
                      className="text-xs font-bold text-text-muted hover:text-foreground transition-all"
                    >
                      Deselect all
                    </button>
                    <button
                      onClick={handleBundleDownload}
                      disabled={selected.size === 0 || downloading}
                      className="ml-2 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-primary-hover disabled:opacity-50 transition-all whitespace-nowrap"
                    >
                      {downloading ? "Preparing…" : `⬇ Download ZIP`}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {data.certs.map((cert) => (
                    <div
                      key={cert.id}
                      className={`bg-white border rounded-2xl p-5 flex items-start gap-5 transition-all cursor-pointer shadow-sm ${
                        selected.has(cert.certificateNumber)
                          ? "border-primary bg-soft-orange/30"
                          : "border-border-default hover:border-primary/40"
                      }`}
                      onClick={() => toggleCert(cert.certificateNumber)}
                    >
                      <div
                        className={`w-5 h-5 rounded-[5px] border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                          selected.has(cert.certificateNumber)
                            ? "bg-primary border-primary"
                            : "border-border-default"
                        }`}
                      >
                        {selected.has(cert.certificateNumber) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-base truncate">
                          {cert.programTitle}
                        </p>
                        <p className="text-xs font-mono font-bold text-primary mt-1">
                          {cert.certificateNumber}
                        </p>
                        <p className="text-xs font-medium text-text-muted mt-1 tracking-wide">
                          ISSUED{" "}
                          {new Date(cert.issuedAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          }).toUpperCase()}
                        </p>
                      </div>

                      <div
                        className="flex gap-2 flex-shrink-0 flex-wrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a
                          href={cert.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-primary bg-soft-orange px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-all border border-primary/20"
                        >
                          PDF
                        </a>
                        <a
                          href={`/api/certificate/png/${cert.certificateNumber}`}
                          download
                          className="text-xs font-bold text-primary bg-soft-orange px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-all border border-primary/20"
                        >
                          PNG
                        </a>
                        <a
                          href={cert.verificationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-text-secondary bg-white px-4 py-2 rounded-lg border border-border-default hover:border-primary/40 hover:text-primary transition-all"
                        >
                          Verify
                        </a>
                        <a
                          href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(cert.verificationUrl)}&title=${encodeURIComponent(`I earned my ${cert.programTitle} certificate from edooka`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-white bg-[#0A66C2] px-4 py-2 rounded-lg hover:bg-[#004182] transition-all"
                        >
                          LinkedIn
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {error && (
              <p className="text-sm font-medium text-red-600 text-center bg-red-50 border border-red-100 rounded-xl py-3 px-4 shadow-sm">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
