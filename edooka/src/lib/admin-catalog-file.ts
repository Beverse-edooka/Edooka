import { randomUUID } from "crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { PROGRAMS } from "@/data/programs";

/** Local JSON catalog when Postgres is unavailable (development only). */
const FILE = join(process.cwd(), ".local", "admin-catalog.json");

export type FileProgramRow = {
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
  createdAt: string;
};

export type FileQuestionRow = {
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
  createdAt: string;
};

type Store = { programs: FileProgramRow[]; questions: FileQuestionRow[] };

function seedStore(): Store {
  const programs: FileProgramRow[] = PROGRAMS.map((p) => ({
    id: `prog:${p.slug}`,
    slug: p.slug,
    title: p.title,
    description: p.description ?? null,
    category: p.category,
    durationMinutes: 15,
    numQuestions: p.questions ?? 18,
    passThreshold: 50,
    iconName: null,
    isActive: true,
    createdAt: new Date().toISOString(),
  }));
  return { programs, questions: [] };
}

function readStore(): Store {
  try {
    if (!existsSync(FILE)) {
      const s = seedStore();
      mkdirSync(dirname(FILE), { recursive: true });
      writeFileSync(FILE, JSON.stringify(s, null, 2), "utf8");
      return s;
    }
    const raw = readFileSync(FILE, "utf8");
    const j = JSON.parse(raw) as Store;
    if (!Array.isArray(j.programs) || !Array.isArray(j.questions)) return seedStore();
    return j;
  } catch {
    const s = seedStore();
    mkdirSync(dirname(FILE), { recursive: true });
    writeFileSync(FILE, JSON.stringify(s, null, 2), "utf8");
    return s;
  }
}

function writeStore(s: Store) {
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(s, null, 2), "utf8");
}

function walkErrorChain(err: unknown): unknown[] {
  const chain: unknown[] = [];
  let e: unknown = err;
  let depth = 0;
  while (e != null && depth < 10) {
    chain.push(e);
    if (e instanceof Error && e.cause != null) {
      e = e.cause;
    } else if (typeof e === "object" && e !== null && "cause" in e) {
      const next = (e as { cause?: unknown }).cause;
      if (next == null) break;
      e = next;
    } else {
      break;
    }
    depth += 1;
  }
  return chain;
}

function flattenErrorMessage(err: unknown): string {
  return walkErrorChain(err)
    .map((e) => {
      if (e instanceof Error) return `${e.name}: ${e.message}`;
      if (typeof e === "object" && e !== null) {
        try {
          return JSON.stringify(e);
        } catch {
          return "[object]";
        }
      }
      return String(e);
    })
    .join(" | ");
}

function collectPostgresCodes(err: unknown): string[] {
  const codes: string[] = [];
  for (const e of walkErrorChain(err)) {
    if (typeof e === "object" && e !== null && "code" in e) {
      const c = (e as { code?: string }).code;
      if (typeof c === "string" && c.length > 0) codes.push(c);
    }
  }
  return codes;
}

/** Use file catalog in dev when DB fails or when EDOOKA_ADMIN_FILE_ONLY=1. */
export function shouldUseAdminFileCatalog(err: unknown): boolean {
  if (process.env.EDOOKA_ADMIN_FILE_ONLY === "1") return true;
  if (process.env.NODE_ENV === "production") return false;

  const codes = collectPostgresCodes(err);
  if (codes.includes("42P01")) return true; // undefined_table
  if (codes.includes("3D000")) return true; // invalid_catalog_name (wrong DB)

  const m = flattenErrorMessage(err);
  return (
    m.includes("ECONNREFUSED") ||
    m.includes("ENOTFOUND") ||
    m.includes("does not exist") ||
    m.includes("password authentication failed") ||
    m.includes("getaddrinfo") ||
    m.includes("SASL") ||
    m.includes("timeout") ||
    m.includes("Failed query") ||
    m.includes("no pg_hba.conf entry")
  );
}

export function adminDbUnavailableHint(): string {
  return [
    "Postgres error: create tables with `npm run db:push`, then `npm run seed` (from the edooka folder).",
    "Ensure Postgres is running and DATABASE_URL in .env.local matches (e.g. docker compose up -d).",
    "Or set EDOOKA_ADMIN_FILE_ONLY=1 in .env.local to use .local/admin-catalog.json for admin CRUD without a DB.",
    "Note: `npm start` sets NODE_ENV=production — file fallback is disabled; use `npm run dev` for local file fallback.",
  ].join(" ");
}

export function fileProgramsList(): FileProgramRow[] {
  const s = readStore();
  return [...s.programs].sort((a, b) => a.title.localeCompare(b.title));
}

export function fileProgramsCreate(body: {
  slug: string;
  title: string;
  description: string | null;
  category: string;
  durationMinutes: number;
  numQuestions: number;
  passThreshold: number;
  iconName: string | null;
  isActive: boolean;
}): FileProgramRow | { error: string } {
  const s = readStore();
  if (s.programs.some((p) => p.slug === body.slug)) {
    return { error: "Slug already exists" };
  }
  const row: FileProgramRow = {
    id: randomUUID(),
    slug: body.slug,
    title: body.title,
    description: body.description,
    category: body.category,
    durationMinutes: body.durationMinutes,
    numQuestions: body.numQuestions,
    passThreshold: body.passThreshold,
    iconName: body.iconName,
    isActive: body.isActive,
    createdAt: new Date().toISOString(),
  };
  s.programs.push(row);
  writeStore(s);
  return row;
}

export function fileProgramsUpdate(
  id: string,
  patch: Partial<{
    slug: string;
    title: string;
    description: string | null;
    category: string;
    durationMinutes: number;
    numQuestions: number;
    passThreshold: number;
    iconName: string | null;
    isActive: boolean;
  }>
): { program: FileProgramRow } | { error: "not_found" | "slug_exists" } {
  const s = readStore();
  const i = s.programs.findIndex((p) => p.id === id);
  if (i === -1) return { error: "not_found" };
  const merged = { ...s.programs[i], ...patch };
  if (patch.slug !== undefined) {
    merged.slug = patch.slug.trim();
    if (s.programs.some((p, j) => j !== i && p.slug === merged.slug)) {
      return { error: "slug_exists" };
    }
  }
  s.programs[i] = merged;
  writeStore(s);
  return { program: merged };
}

export function fileProgramsDelete(id: string): boolean {
  const s = readStore();
  const before = s.programs.length;
  s.programs = s.programs.filter((p) => p.id !== id);
  s.questions = s.questions.filter((q) => q.programId !== id);
  writeStore(s);
  return s.programs.length < before;
}

export function fileQuestionsList(programId: string | null): Array<
  FileQuestionRow & { programTitle: string; programSlug: string }
> {
  const s = readStore();
  const progById = new Map(s.programs.map((p) => [p.id, p]));
  let qs = s.questions;
  if (programId) qs = qs.filter((q) => q.programId === programId);
  return qs
    .map((q) => {
      const p = progById.get(q.programId);
      return {
        ...q,
        programTitle: p?.title ?? "?",
        programSlug: p?.slug ?? "?",
      };
    })
    .sort((a, b) => {
      const t = a.programTitle.localeCompare(b.programTitle);
      if (t !== 0) return t;
      return a.createdAt.localeCompare(b.createdAt);
    });
}

export function fileQuestionsCreate(body: {
  programId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  rationale: string | null;
  orderIndex: number | null;
}): FileQuestionRow | { error: string } {
  const s = readStore();
  if (!s.programs.some((p) => p.id === body.programId)) {
    return { error: "Invalid program" };
  }
  const row: FileQuestionRow = {
    id: randomUUID(),
    programId: body.programId,
    questionText: body.questionText,
    optionA: body.optionA,
    optionB: body.optionB,
    optionC: body.optionC,
    optionD: body.optionD,
    correctOption: body.correctOption,
    rationale: body.rationale,
    orderIndex: body.orderIndex,
    createdAt: new Date().toISOString(),
  };
  s.questions.push(row);
  writeStore(s);
  return row;
}

export function fileQuestionsUpdate(
  id: string,
  patch: Partial<{
    programId: string;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: string;
    rationale: string | null;
    orderIndex: number | null;
  }>
): FileQuestionRow | null {
  const s = readStore();
  const i = s.questions.findIndex((q) => q.id === id);
  if (i === -1) return null;
  if (patch.programId !== undefined && !s.programs.some((p) => p.id === patch.programId)) {
    return null;
  }
  s.questions[i] = { ...s.questions[i], ...patch };
  writeStore(s);
  return s.questions[i];
}

export function fileQuestionsDelete(id: string): boolean {
  const s = readStore();
  const before = s.questions.length;
  s.questions = s.questions.filter((q) => q.id !== id);
  writeStore(s);
  return s.questions.length < before;
}
