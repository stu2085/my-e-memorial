import { supabase } from "../../app/lib/supabase";

type UploadToSupabaseOptions = {
  file: File;
  folder: string;
  bucket: string;
};

function getMemorialIdFromCurrentUrl() {
  if (typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const parsed = Number(
    params.get("edit") ||
      params.get("draft") ||
      params.get("memorialId") ||
      0
  );

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

async function uploadWithBackupPersonAccess({
  file,
  folder,
  bucket,
}: UploadToSupabaseOptions): Promise<string> {
  const memorialId = getMemorialIdFromCurrentUrl();

  if (!memorialId) {
    throw new Error(
      "You must be signed in or use authorized Backup Person access to upload this file."
    );
  }

  const ticketResponse = await fetch("/api/backup-media-upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      memorialId,
      folder,
      bucket,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      fileSize: file.size,
    }),
  });

  const ticketResult = await ticketResponse.json();

  if (
    !ticketResponse.ok ||
    !ticketResult?.path ||
    !ticketResult?.token
  ) {
    throw new Error(
      ticketResult?.error ||
        "Authorized Backup Person upload could not be prepared."
    );
  }

  const { data: uploadData, error: uploadError } =
    await supabase.storage
      .from(bucket)
      .uploadToSignedUrl(
        ticketResult.path,
        ticketResult.token,
        file,
        {
          contentType:
            file.type || "application/octet-stream",
          upsert: false,
        }
      );

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const uploadedPath =
    uploadData?.path || ticketResult.path;

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(uploadedPath);

  return data.publicUrl;
}

export async function uploadToSupabase({
  file,
  folder,
  bucket,
}: UploadToSupabaseOptions): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  /*
   * Logged-in memorial owners keep the existing direct Supabase
   * Storage upload path and its existing RLS protections.
   *
   * Backup Persons intentionally do not receive a Supabase Auth
   * session. When no owner session exists, request a short-lived,
   * one-file signed upload token from MyEMemorial. The server route
   * validates the hardened Backup Person cookie, independent death
   * verification, post-death activation, the memorial slug, bucket,
   * and permitted storage folder before issuing that token.
   */
  if (!session?.access_token) {
    return uploadWithBackupPersonAccess({
      file,
      folder,
      bucket,
    });
  }

  const fileExt = file.name.split(".").pop() || "jpg";

  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${fileExt}`;

  const filePath = `${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
}
