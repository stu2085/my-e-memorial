import { supabase } from "../../app/lib/supabase";

type UploadToSupabaseOptions = {
  file: File;
  folder: string;
  bucket: string;
};

export async function uploadToSupabase({
  file,
  folder,
  bucket,
}: UploadToSupabaseOptions): Promise<string> {
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