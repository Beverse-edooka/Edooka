"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProgramCardArticle } from "@/components/assessment/ProgramCard";
import type { ProgramCard } from "@/data/programs";
import { useCatalogPrograms } from "@/hooks/use-catalog-programs";

type Props = {
  showStart?: boolean;
  trendingLimit?: number;
  showViewMore?: boolean;
};

export function AssessmentsGrid({ showStart = true, trendingLimit, showViewMore = false }: Props) {
  const { programs: catalog } = useCatalogPrograms();
  const categories = useMemo(
    () => [...new Set(catalog.map((p) => p.category))].sort((a, b) => a.localeCompare(b)),
    [catalog]
  );
  const [filter, setFilter] = useState<string>("All");

  const filtered: ProgramCard[] =
    filter === "All" ? catalog : catalog.filter((p) => p.category === filter);

  const sorted = useMemo(() => {
    const trending = filtered.filter((a) => a.badge === "Trending");
    const rest = filtered.filter((a) => a.badge !== "Trending");
    return [...trending, ...rest];
  }, [filtered]);

  const visible =
    showViewMore && trendingLimit ? sorted.slice(0, trendingLimit) : sorted;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {["All", ...categories].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              filter === cat
                ? "bg-primary text-white shadow"
                : "bg-white border border-border-default text-text-primary hover:border-primary/40"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-text-muted">No assessments in this category yet.</p>
      ) : (
        <div className="grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible.map((item, i) => (
              <motion.div
                key={item.slug}
                layout
                className="h-full"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ProgramCardArticle program={item} showStart={showStart} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {showViewMore && trendingLimit && sorted.length > trendingLimit ? (
        <div className="flex justify-center pt-2">
          <Link
            href="/library"
            className="rounded-full border-2 border-primary px-8 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
          >
            View more ({sorted.length - trendingLimit} more) →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
