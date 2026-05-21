"use client";

import { useEffect, useState } from "react";
import type { ProgramCard } from "@/data/programs";

export function useCatalogPrograms() {
  const [programs, setPrograms] = useState<ProgramCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/catalog/programs")
      .then((r) => r.json())
      .then((data: { programs?: ProgramCard[] }) => {
        if (Array.isArray(data.programs)) {
          setPrograms(data.programs);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { programs, loading };
}
