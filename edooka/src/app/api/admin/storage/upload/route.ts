import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { uploadBufferToStorage } from "@/lib/supabase/storage";

export const runtime = "nodejs";

/**
 * POST /api/admin/storage/upload
 * multipart/form-data: field `file` (required), optional `prefix` (folder under bucket).
 * Requires admin cookie. Supabase project must have the bucket (default name in getDefaultStorageBucket).
 */
export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form-data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file field required" }, { status: 400 });
  }

  const prefix = String(form.get("prefix") ?? "")
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^\w\-./]/g, "");

  const original = file.name.replace(/[^\w.\-]/g, "_") || "upload.bin";
  const objectPath = prefix ? `${prefix}/${Date.now()}-${original}` : `${Date.now()}-${original}`;

  const buf = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "application/octet-stream";

  try {
    const { bucket, path } = await uploadBufferToStorage(objectPath, buf, contentType);
    return NextResponse.json({ ok: true, bucket, path });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        error: message,
        hint:
          "Create a Storage bucket in Supabase (same name as SUPABASE_STORAGE_BUCKET or edooka-files). " +
          "Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local.",
      },
      { status: 502 }
    );
  }
}
