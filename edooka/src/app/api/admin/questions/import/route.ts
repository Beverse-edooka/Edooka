import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { programs, questions } from "@/lib/db/schema";
import {
  adminDbUnavailableHint,
  fileQuestionsCreate,
  shouldUseAdminFileCatalog,
} from "@/lib/admin-catalog-file";
import { parseQuestionsCsv } from "@/lib/parse-questions-csv";
import { requireAdmin } from "@/lib/require-admin";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

function normalizeCorrect(c: string): "a" | "b" | "c" | "d" {
  const x = c.trim().toLowerCase();
  if (x === "a" || x === "b" || x === "c" || x === "d") return x;
  return "a";
}

/**
 * POST /api/admin/questions/import
 * multipart/form-data: programId (required), file (CSV)
 */
export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form with programId and file" }, { status: 400 });
  }

  const programId = String(form.get("programId") ?? "").trim();
  const file = form.get("file");
  if (!programId) {
    return NextResponse.json({ error: "programId is required" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
    return NextResponse.json({ error: "Upload a .csv file" }, { status: 400 });
  }

  const text = await file.text();
  const parsed = parseQuestionsCsv(text);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, line: parsed.line },
      { status: 400 }
    );
  }

  try {
    const [program] = await db.select().from(programs).where(eq(programs.id, programId)).limit(1);
    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    const values = parsed.rows.map((row) => ({
      programId,
      questionText: row.questionText,
      optionA: row.optionA,
      optionB: row.optionB,
      optionC: row.optionC,
      optionD: row.optionD,
      correctOption: normalizeCorrect(row.correctOption),
      rationale: row.rationale,
      orderIndex: row.orderIndex,
    }));

    const inserted = await db.insert(questions).values(values).returning({ id: questions.id });

    return NextResponse.json({
      ok: true,
      imported: inserted.length,
      source: "postgres",
    });
  } catch (e) {
    if (shouldUseAdminFileCatalog(e)) {
      let imported = 0;
      const errors: string[] = [];
      for (let i = 0; i < parsed.rows.length; i++) {
        const row = parsed.rows[i];
        const result = fileQuestionsCreate({
          programId,
          questionText: row.questionText,
          optionA: row.optionA,
          optionB: row.optionB,
          optionC: row.optionC,
          optionD: row.optionD,
          correctOption: normalizeCorrect(row.correctOption),
          rationale: row.rationale,
          orderIndex: row.orderIndex,
        });
        if ("error" in result) {
          errors.push(`Row ${i + 1}: ${result.error}`);
        } else {
          imported++;
        }
      }
      if (imported === 0) {
        return NextResponse.json({ error: errors[0] ?? "Import failed" }, { status: 400 });
      }
      return NextResponse.json({
        ok: true,
        imported,
        source: "file",
        warnings: errors.length ? errors : undefined,
      });
    }
    return NextResponse.json(
      { error: String(e), hint: adminDbUnavailableHint() },
      { status: 503 }
    );
  }
}
