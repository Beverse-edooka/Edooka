import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { programs, questions } from "@/lib/db/schema";
import {
  adminDbUnavailableHint,
  fileQuestionsCreate,
  fileQuestionsDelete,
  fileQuestionsList,
  fileQuestionsUpdate,
  shouldUseAdminFileCatalog,
} from "@/lib/admin-catalog-file";
import { requireAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

function normalizeCorrect(c: string): "a" | "b" | "c" | "d" {
  const x = c.trim().toLowerCase();
  if (x === "a" || x === "b" || x === "c" || x === "d") return x;
  return "a";
}

const selectShape = {
  id: questions.id,
  programId: questions.programId,
  questionText: questions.questionText,
  optionA: questions.optionA,
  optionB: questions.optionB,
  optionC: questions.optionC,
  optionD: questions.optionD,
  correctOption: questions.correctOption,
  rationale: questions.rationale,
  orderIndex: questions.orderIndex,
  createdAt: questions.createdAt,
  programTitle: programs.title,
  programSlug: programs.slug,
};

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;
  const programId = req.nextUrl.searchParams.get("programId");
  try {
    const rows = programId
      ? await db
          .select(selectShape)
          .from(questions)
          .innerJoin(programs, eq(questions.programId, programs.id))
          .where(eq(questions.programId, programId))
          .orderBy(asc(programs.title), asc(questions.createdAt))
      : await db
          .select(selectShape)
          .from(questions)
          .innerJoin(programs, eq(questions.programId, programs.id))
          .orderBy(asc(programs.title), asc(questions.createdAt));
    return NextResponse.json({ questions: rows, source: "postgres" });
  } catch (e) {
    if (shouldUseAdminFileCatalog(e)) {
      const rows = fileQuestionsList(programId);
      return NextResponse.json({ questions: rows, source: "file" });
    }
    return NextResponse.json(
      { error: String(e), hint: adminDbUnavailableHint() },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;
  const body = (await req.json()) as {
    programId?: string;
    questionText?: string;
    optionA?: string;
    optionB?: string;
    optionC?: string;
    optionD?: string;
    correctOption?: string;
    rationale?: string | null;
    orderIndex?: number | null;
  };
  if (!body.programId || !body.questionText?.trim()) {
    return NextResponse.json({ error: "programId and questionText required" }, { status: 400 });
  }
  const values = {
    programId: body.programId,
    questionText: body.questionText.trim(),
    optionA: (body.optionA ?? "").trim() || "—",
    optionB: (body.optionB ?? "").trim() || "—",
    optionC: (body.optionC ?? "").trim() || "—",
    optionD: (body.optionD ?? "").trim() || "—",
    correctOption: normalizeCorrect(body.correctOption ?? "a"),
    rationale: body.rationale?.trim() || null,
    orderIndex: body.orderIndex ?? null,
  };
  try {
    const [row] = await db.insert(questions).values(values).returning();
    return NextResponse.json({ question: row, source: "postgres" });
  } catch (e) {
    if (shouldUseAdminFileCatalog(e)) {
      const row = fileQuestionsCreate({
        ...values,
        correctOption: values.correctOption,
      });
      if ("error" in row) return NextResponse.json({ error: row.error }, { status: 400 });
      return NextResponse.json({ question: row, source: "file" });
    }
    return NextResponse.json(
      { error: String(e), hint: adminDbUnavailableHint() },
      { status: 503 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;
  const body = (await req.json()) as {
    id?: string;
    programId?: string;
    questionText?: string;
    optionA?: string;
    optionB?: string;
    optionC?: string;
    optionD?: string;
    correctOption?: string;
    rationale?: string | null;
    orderIndex?: number | null;
  };
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    const [row] = await db
      .update(questions)
      .set({
        ...(body.programId !== undefined ? { programId: body.programId } : {}),
        ...(body.questionText !== undefined ? { questionText: body.questionText.trim() } : {}),
        ...(body.optionA !== undefined ? { optionA: body.optionA.trim() } : {}),
        ...(body.optionB !== undefined ? { optionB: body.optionB.trim() } : {}),
        ...(body.optionC !== undefined ? { optionC: body.optionC.trim() } : {}),
        ...(body.optionD !== undefined ? { optionD: body.optionD.trim() } : {}),
        ...(body.correctOption !== undefined ? { correctOption: normalizeCorrect(body.correctOption) } : {}),
        ...(body.rationale !== undefined ? { rationale: body.rationale } : {}),
        ...(body.orderIndex !== undefined ? { orderIndex: body.orderIndex } : {}),
      })
      .where(eq(questions.id, body.id))
      .returning();
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ question: row, source: "postgres" });
  } catch (e) {
    if (shouldUseAdminFileCatalog(e)) {
      const patch = {
        ...(body.programId !== undefined ? { programId: body.programId } : {}),
        ...(body.questionText !== undefined ? { questionText: body.questionText.trim() } : {}),
        ...(body.optionA !== undefined ? { optionA: body.optionA.trim() } : {}),
        ...(body.optionB !== undefined ? { optionB: body.optionB.trim() } : {}),
        ...(body.optionC !== undefined ? { optionC: body.optionC.trim() } : {}),
        ...(body.optionD !== undefined ? { optionD: body.optionD.trim() } : {}),
        ...(body.correctOption !== undefined ? { correctOption: normalizeCorrect(body.correctOption) } : {}),
        ...(body.rationale !== undefined ? { rationale: body.rationale } : {}),
        ...(body.orderIndex !== undefined ? { orderIndex: body.orderIndex } : {}),
      };
      const row = fileQuestionsUpdate(body.id, patch);
      if (!row) return NextResponse.json({ error: "Not found or invalid program" }, { status: 404 });
      return NextResponse.json({ question: row, source: "file" });
    }
    return NextResponse.json(
      { error: String(e), hint: adminDbUnavailableHint() },
      { status: 503 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id query required" }, { status: 400 });
  try {
    await db.delete(questions).where(eq(questions.id, id));
    return NextResponse.json({ ok: true, source: "postgres" });
  } catch (e) {
    if (shouldUseAdminFileCatalog(e)) {
      const ok = fileQuestionsDelete(id);
      if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ ok: true, source: "file" });
    }
    return NextResponse.json(
      { error: String(e), hint: adminDbUnavailableHint() },
      { status: 503 }
    );
  }
}
