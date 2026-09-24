import type { SupabaseClient } from "@supabase/supabase-js";

// Keep the original Presentation and its media in place. Existing media URLs,
// Mux assets, timeline order, and builder links continue to work. The paid
// memorial relationship is the durable entitlement; no media is duplicated.
const PRESERVED_EXPIRATION = "9999-12-31T23:59:59.000Z";

export async function preserveLinkedCelebration(
  admin: SupabaseClient,
  memorialId: number,
  ownerId: string
) {
  const { data: presentation, error: lookupError } = await admin
    .from("celebration_presentations")
    .select("id, status, payment_status, claimed_by, expires_at, converted_memorial_id")
    .eq("memorial_id", memorialId)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (!presentation) return;
  if (presentation.claimed_by !== ownerId) {
    throw new Error("The linked Presentation owner does not match the MyEMemorial owner.");
  }
  if (presentation.converted_memorial_id === memorialId) return;

  const now = new Date().toISOString();
  if (
    presentation.status !== "active" ||
    presentation.payment_status !== "paid" ||
    !presentation.expires_at ||
    new Date(presentation.expires_at).getTime() <= Date.now()
  ) {
    throw new Error("The linked Presentation expired before its paid MyEMemorial upgrade was confirmed.");
  }

  const { data: preserved, error: updateError } = await admin
    .from("celebration_presentations")
    .update({
      converted_memorial_id: memorialId,
      converted_at: now,
      expires_at: PRESERVED_EXPIRATION,
    })
    .eq("id", presentation.id)
    .eq("memorial_id", memorialId)
    .eq("claimed_by", ownerId)
    .eq("status", "active")
    .eq("payment_status", "paid")
    .is("converted_memorial_id", null)
    .gt("expires_at", now)
    .select("id")
    .maybeSingle();

  if (updateError) throw updateError;
  if (preserved) return;

  // Stripe's webhook and the owner's payment-return verifier can race.
  const { data: concurrent, error: raceError } = await admin
    .from("celebration_presentations")
    .select("converted_memorial_id")
    .eq("id", presentation.id)
    .maybeSingle();

  if (raceError || concurrent?.converted_memorial_id !== memorialId) {
    throw raceError || new Error("The linked Presentation could not be preserved.");
  }
}
