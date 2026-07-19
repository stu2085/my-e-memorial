import { supabase } from "../../app/lib/supabase";

type CreateBaseSlugOptions = {
  firstName: string;
  middleName: string;
  lastName: string;
};

export class SlugEngine {
  static createBaseSlug({
    firstName,
    middleName,
    lastName,
  }: CreateBaseSlugOptions): string {
    const fullName = `${firstName} ${middleName} ${lastName}`
      .replace(/\s+/g, " ")
      .trim();

    return fullName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
  }

  static async createUniqueSlug(baseSlug: string): Promise<string> {
    let candidate = baseSlug;
    let counter = 2;

    while (true) {
      const { data, error } = await supabase
        .from("memorials")
        .select("id")
        .eq("slug", candidate)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        return candidate;
      }

      candidate = `${baseSlug}-${counter}`;
      counter += 1;
    }
  }
}
