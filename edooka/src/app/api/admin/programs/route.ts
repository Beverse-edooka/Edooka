import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { programs } from "@/lib/db/schema";
import {
  adminDbUnavailableHint,
  fileProgramsCreate,
  fileProgramsDelete,
  fileProgramsList,
  fileProgramsUpdate,
  shouldUseAdminFileCatalog,
} from "@/lib/admin-catalog-file";
import { requireAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;
  try {
    const rows = await db.select().from(programs).orderBy(asc(programs.title));
    return NextResponse.json({ programs: rows, source: "postgres" });
  } catch (e) {
    if (shouldUseAdminFileCatalog(e)) {
      return NextResponse.json({ programs: fileProgramsList(), source: "file" });
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
    slug?: string;
    title?: string;
    description?: string | null;
    category?: string;
    durationMinutes?: number;
    numQuestions?: number;
    passThreshold?: number;
    iconName?: string | null;
    isActive?: boolean;
  };
  if (!body.slug?.trim() || !body.title?.trim() || !body.category?.trim()) {
    return NextResponse.json({ error: "slug, title, and category are required" }, { status: 400 });
  }
  const values = {
    slug: body.slug.trim(),
    title: body.title.trim(),
    description: body.description?.trim() ?? null,
    category: body.category.trim(),
    durationMinutes: body.durationMinutes ?? 15,
    numQuestions: body.numQuestions ?? 18,
    passThreshold: body.passThreshold ?? 50,
    iconName: body.iconName?.trim() || null,
    isActive: body.isActive ?? true,
  };
  try {
    const [row] = await db.insert(programs).values(values).returning();
    return NextResponse.json({ program: row, source: "postgres" });
  } catch (e) {
    if (shouldUseAdminFileCatalog(e)) {
      const row = fileProgramsCreate(values);
      if ("error" in row) return NextResponse.json({ error: row.error }, { status: 409 });
      return NextResponse.json({ program: row, source: "file" });
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
    slug?: string;
    title?: string;
    description?: string | null;
    category?: string;
    durationMinutes?: number;
    numQuestions?: number;
    passThreshold?: number;
    iconName?: string | null;
    isActive?: boolean;
  };
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    const [row] = await db
      .update(programs)
      .set({
        ...(body.slug !== undefined ? { slug: body.slug.trim() } : {}),
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.category !== undefined ? { category: body.category.trim() } : {}),
        ...(body.durationMinutes !== undefined ? { durationMinutes: body.durationMinutes } : {}),
        ...(body.numQuestions !== undefined ? { numQuestions: body.numQuestions } : {}),
        ...(body.passThreshold !== undefined ? { passThreshold: body.passThreshold } : {}),
        ...(body.iconName !== undefined ? { iconName: body.iconName } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      })
      .where(eq(programs.id, body.id))
      .returning();
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ program: row, source: "postgres" });
  } catch (e) {
    if (shouldUseAdminFileCatalog(e)) {
      const patch = {
        ...(body.slug !== undefined ? { slug: body.slug.trim() } : {}),
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.category !== undefined ? { category: body.category.trim() } : {}),
        ...(body.durationMinutes !== undefined ? { durationMinutes: body.durationMinutes } : {}),
        ...(body.numQuestions !== undefined ? { numQuestions: body.numQuestions } : {}),
        ...(body.passThreshold !== undefined ? { passThreshold: body.passThreshold } : {}),
        ...(body.iconName !== undefined ? { iconName: body.iconName } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      };
      const out = fileProgramsUpdate(body.id, patch);
      if ("error" in out) {
        if (out.error === "not_found") return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
      }
      return NextResponse.json({ program: out.program, source: "file" });
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
    await db.delete(programs).where(eq(programs.id, id));
    return NextResponse.json({ ok: true, source: "postgres" });
  } catch (e) {
    if (shouldUseAdminFileCatalog(e)) {
      const ok = fileProgramsDelete(id);
      if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ ok: true, source: "file" });
    }
    return NextResponse.json(
      { error: String(e), hint: adminDbUnavailableHint() },
      { status: 503 }
    );
  }
}
