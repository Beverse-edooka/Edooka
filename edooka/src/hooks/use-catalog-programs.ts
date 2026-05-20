"use client";

import { useEffect, useState } from "react";
import { PROGRAMS, type ProgramCard } from "@/data/programs";

export function useCatalogPrograms() {
  const [programs, setPrograms] = useState<ProgramCard[]>(PROGRAMS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/catalog/programs")
      .then((r) => r.json())
      .then((data: { programs?: ProgramCard[] }) => {
        if (Array.isArray(data.programs) && data.programs.length > 0) {
          setPrograms(data.programs);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { programs, loading };
}
