import {
  ASSESSMENT_DURATION_LABEL,
  ASSESSMENT_NUM_QUESTIONS,
} from "@/lib/assessment-constants";

/**
 * Canonical catalog for assessments (homepage, assessment detail, quiz labels).
 * Keeps marketing pages working without a running PostgreSQL instance.
 */
export type ProgramCard = {
  slug: string;
  category: string;
  title: string;
  description: string;
  questions: number;
  durationLabel: string;
  price: number;
  badge: string;
};

export const PROGRAMS: ProgramCard[] = [
  {
    slug: "diagnostic-lab",
    category: "Diagnostics",
    title: "Diagnostic Lab Operations",
    description:
      "Quality systems, workflow, and safety essentials for pathology and diagnostic laboratory professionals.",
    questions: ASSESSMENT_NUM_QUESTIONS,
    durationLabel: ASSESSMENT_DURATION_LABEL,
    price: 218,
    badge: "Trending",
  },
  {
    slug: "nursing-admin",
    category: "Clinical",
    title: "Nursing Administration",
    description:
      "Leadership, ward coordination, and documentation standards for nursing administrators.",
    questions: ASSESSMENT_NUM_QUESTIONS,
    durationLabel: ASSESSMENT_DURATION_LABEL,
    price: 218,
    badge: "Trending",
  },
  {
    slug: "physiotherapy",
    category: "Clinical",
    title: "Physiotherapy Leadership",
    description:
      "Clinic operations, patient pathways, and team leadership for physiotherapy practice heads.",
    questions: ASSESSMENT_NUM_QUESTIONS,
    durationLabel: ASSESSMENT_DURATION_LABEL,
    price: 218,
    badge: "Trending",
  },
  {
    slug: "radiology",
    category: "Diagnostics",
    title: "Radiology Workflow Essentials",
    description:
      "Imaging workflow, safety culture, and interdisciplinary coordination in radiology settings.",
    questions: ASSESSMENT_NUM_QUESTIONS,
    durationLabel: ASSESSMENT_DURATION_LABEL,
    price: 218,
    badge: "Popular",
  },
  {
    slug: "healthcare-sales",
    category: "Clinical",
    title: "Healthcare Sales Foundations",
    description:
      "Ethical selling, stakeholder alignment, and trust-building in healthcare commercial roles.",
    questions: ASSESSMENT_NUM_QUESTIONS,
    durationLabel: ASSESSMENT_DURATION_LABEL,
    price: 218,
    badge: "New",
  },
  {
    slug: "ward-docs",
    category: "Clinical",
    title: "Ward Documentation Excellence",
    description:
      "Structured documentation, handoffs, and audit readiness for ward-level clinical teams.",
    questions: ASSESSMENT_NUM_QUESTIONS,
    durationLabel: ASSESSMENT_DURATION_LABEL,
    price: 218,
    badge: "New",
  },
];

export function getProgramBySlug(slug: string): ProgramCard | undefined {
  return PROGRAMS.find((p) => p.slug === slug);
}

/** Unique categories from the catalog (for filter chips). */
export function getProgramCategories(): string[] {
  return [...new Set(PROGRAMS.map((p) => p.category))].sort((a, b) => a.localeCompare(b));
}
