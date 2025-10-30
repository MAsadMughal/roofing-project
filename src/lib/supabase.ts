import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

// Client (browser) Supabase instance – safe for use in +page.ts, components, etc.
export function createSupabaseBrowserClient(): SupabaseClient {
  const url = publicEnv.PUBLIC_SUPABASE_URL;
  const anonKey = publicEnv.PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error('Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY');
  return createClient(url, anonKey);
}

// Server admin Supabase instance – use ONLY in +page.server.ts / endpoints.
export function createSupabaseAdminClient(): SupabaseClient {
  const url = privateEnv.SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_URL;
  const serviceKey = privateEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, serviceKey);
}

type UploadInput = {
  bucket: string;
  file: File | Blob | Uint8Array | ArrayBuffer;
  /**
   * Path inside the bucket. If omitted, a unique path is generated preserving the extension.
   * Example: `images/user-123/avatar.png`
   */
  path?: string;
  contentType?: string;
  upsert?: boolean;
};

type UploadResult = {
  path: string;
  publicUrl: string | null;
};

function ensurePath(path: string | undefined, fileLike: File | Blob | Uint8Array | ArrayBuffer): string {
  if (path) return path;
  const suggested = (fileLike as File).name || 'upload.bin';
  const ext = suggested.includes('.') ? suggested.split('.').pop() : 'bin';
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${unique}.${ext}`;
}

async function toUploadBody(fileLike: File | Blob | Uint8Array | ArrayBuffer): Promise<Blob | ArrayBuffer | Uint8Array> {
  if (fileLike instanceof Blob) return fileLike;
  if (fileLike instanceof Uint8Array) return fileLike;
  if (fileLike instanceof ArrayBuffer) return fileLike;
  // File on server implements Blob and has arrayBuffer
  // but in some environments a structural check is safer
  // @ts-expect-error - runtime check for arrayBuffer
  if (typeof fileLike.arrayBuffer === 'function') return await fileLike.arrayBuffer();
  throw new Error('Unsupported file type for upload');
}

// Upload from the BROWSER using the anon client and bucket RLS
export async function uploadFileClient(input: UploadInput): Promise<UploadResult> {
  const client = createSupabaseBrowserClient();
  const path = ensurePath(input.path, input.file);
  const body = await toUploadBody(input.file);
  const { error } = await client.storage.from(input.bucket).upload(path, body, {
    upsert: input.upsert ?? false,
    contentType: input.contentType || (input.file as File).type || undefined
  });
  if (error) throw error;
  const { data } = client.storage.from(input.bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl ?? null };
}

// Upload from the SERVER using the service role client
export async function uploadFileServer(input: UploadInput): Promise<UploadResult> {
  const admin = createSupabaseAdminClient();
  const path = ensurePath(input.path, input.file);
  const body = await toUploadBody(input.file);
  const { error } = await admin.storage.from(input.bucket).upload(path, body, {
    upsert: input.upsert ?? false,
    contentType: input.contentType || (input.file as File).type || undefined
  });
  if (error) throw error;
  const { data } = admin.storage.from(input.bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl ?? null };
}