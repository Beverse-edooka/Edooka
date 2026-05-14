import { NextRequest, NextResponse } from "next/server";
import { getActiveProgramBySlug } from "@/server/queries/programs";
import { getRandomQuestionsForAttempt, mapDbQuestionToAssessment } from "@/server/queries/questions";

export const runtime = "nodejs";

/**
 * GET /api/quiz/questions?slug=…
 * Public endpoint: loads exam questions created in admin for that program slug.
 */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")?.trim() ?? "";
  if (!slug) {
    return NextResponse.json({ error: "slug_required" }, { status: 400 });
  }

  try {
    const program = await getActiveProgramBySlug(slug);
    if (!program) {
      return NextResponse.json({ error: "program_not_found" }, { status: 404 });
    }

    const rows = await getRandomQuestionsForAttempt(program.id, program.numQuestions);
    if (rows.length === 0) {
      return NextResponse.json(
        {
          error: "no_questions",
          program: {
            slug: program.slug,
            title: program.title,
            category: program.category,
          },
        },
        { status: 404 }
      );
    }

    const questions = rows.map(mapDbQuestionToAssessment);
    return NextResponse.json({
      program: {
        slug: program.slug,
        title: program.title,
        category: program.category,
        numQuestions: program.numQuestions,
        passThreshold: program.passThreshold,
      },
      questions,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "load_failed", message: String(e) },
      { status: 500 }
    );
  }
}
