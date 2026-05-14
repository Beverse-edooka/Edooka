import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client with the service role key.
 * Never import this module from client components.
 */
export function getSupabaseServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function getDefaultStorageBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || "edooka-files";
}

/**
 * Upload bytes to Supabase Storage (upsert). Create the bucket in the Supabase
 * dashboard (Storage → New bucket) and set SUPABASE_STORAGE_BUCKET if not using `edooka-files`.
 */
export async function uploadBufferToStorage(
  pathInBucket: string,
  body: Buffer,
  contentType: string
): Promise<{ bucket: string; path: string }> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    throw new Error(
      "Supabase Storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  const bucket = getDefaultStorageBucket();
  const { data, error } = await supabase.storage.from(bucket).upload(pathInBucket, body, {
    contentType,
    upsert: true,
  });
  if (error) throw error;
  return { bucket, path: data.path };
}
