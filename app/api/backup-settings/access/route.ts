import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function fromNullableBoolean(value: boolean | null) {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "";
}

export async function GET(req: NextRequest) {
  try {
    const memorialId = Number(
      req.nextUrl.searchParams.get("memorialId")
    );

    if (!Number.isFinite(memorialId) || memorialId <= 0) {
      return NextResponse.json(
        { error: "A valid memorial ID is required." },
        { status: 400 }
      );
    }

    const accessCheckUrl = new URL(
  `/api/backup-access?memorialId=${memorialId}`,
  req.url
);

const accessCheckResponse = await fetch(accessCheckUrl, {
  method: "GET",
  headers: {
    cookie: req.headers.get("cookie") || "",
  },
  cache: "no-store",
});

const accessCheckResult = await accessCheckResponse.json();

if (
  !accessCheckResponse.ok ||
  accessCheckResult?.valid !== true
) {
  return NextResponse.json(
    { error: "Backup access is not valid." },
    { status: 403 }
  );
}

    const { data: memorial, error: memorialError } =
      await supabaseAdmin
        .from("memorials")
        .select("id, is_living_preplan")
        .eq("id", memorialId)
        .maybeSingle();

    if (memorialError || !memorial) {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }

    if (memorial.is_living_preplan !== true) {
      return NextResponse.json(
        {
          error:
            "Backup-person access is only available for Living MyEMemorials.",
        },
        { status: 403 }
      );
    }

    const { data: settings, error: settingsError } =
      await supabaseAdmin
        .from("memorial_backup_settings")
        .select(`
          backup_phone,
          secondary_backup_name,
          secondary_backup_email,
          secondary_backup_phone,
          secondary_backup_activated_at,
          secondary_backup_activated_by,
          has_will,
          has_executor,
          primary_backup_is_executor,
          has_funeral_decision_designee,
          primary_backup_is_funeral_designee,
          funeral_decision_person_name,
          funeral_decision_person_relationship,
          funeral_authority_document_location,
          primary_funeral_home_name,
          primary_funeral_home_city,
          primary_funeral_home_state,
          primary_funeral_home_website,
          primary_funeral_home_email,
primary_funeral_home_notify_authorized,
primary_funeral_home_notified_at,
          primary_funeral_home_acknowledged_at,
          primary_funeral_home_unavailable_at,
          primary_funeral_home_unavailable_reason,
          alternate_funeral_home_name,
          alternate_funeral_home_city,
          alternate_funeral_home_state,
          alternate_funeral_home_website,
          alternate_funeral_home_email,
alternate_funeral_home_notify_authorized,
alternate_funeral_home_activated_at,
          alternate_funeral_home_notified_at,
          alternate_funeral_home_acknowledged_at
        `)
        .eq("memorial_id", memorialId)
        .maybeSingle();

    if (settingsError) {
      console.error(
        "BACKUP PERSON SETTINGS LOAD ERROR:",
        settingsError
      );

      return NextResponse.json(
        { error: settingsError.message },
        { status: 500 }
      );
    }

    const { data: legacy, error: legacyError } =
      await supabaseAdmin
        .from("memorial_legacy_handoff")
        .select(`
          legacy_instructions,
private_owner_message,
post_death_access_unlocked_at
        `)
        .eq("memorial_id", memorialId)
        .maybeSingle();

    if (legacyError) {
      console.error(
        "BACKUP PERSON LEGACY LOAD ERROR:",
        legacyError
      );

      return NextResponse.json(
        { error: legacyError.message },
        { status: 500 }
      );
    }

    const postDeathUnlocked =
      Boolean(legacy?.post_death_access_unlocked_at);

    return NextResponse.json({
      success: true,

      settings: {
        backupPhone:
          settings?.backup_phone ?? "",

        secondaryBackupName:
          settings?.secondary_backup_name ?? "",

        secondaryBackupEmail:
          settings?.secondary_backup_email ?? "",

        secondaryBackupPhone:
          settings?.secondary_backup_phone ?? "",

        secondaryBackupActivatedAt:
          settings?.secondary_backup_activated_at ?? "",

        secondaryBackupActivatedBy:
          settings?.secondary_backup_activated_by ?? "",

        hasWill:
          fromNullableBoolean(settings?.has_will ?? null),

        hasExecutor:
          fromNullableBoolean(settings?.has_executor ?? null),

        primaryBackupIsExecutor:
          fromNullableBoolean(
            settings?.primary_backup_is_executor ?? null
          ),

        hasFuneralDecisionDesignee:
          fromNullableBoolean(
            settings?.has_funeral_decision_designee ?? null
          ),

        primaryBackupIsFuneralDesignee:
          fromNullableBoolean(
            settings?.primary_backup_is_funeral_designee ?? null
          ),

        funeralDecisionPersonName:
          settings?.funeral_decision_person_name ?? "",

        funeralDecisionPersonRelationship:
          settings?.funeral_decision_person_relationship ?? "",

        funeralAuthorityDocumentLocation:
          settings?.funeral_authority_document_location ?? "",

        primaryFuneralHomeName:
          settings?.primary_funeral_home_name ?? "",

        primaryFuneralHomeCity:
          settings?.primary_funeral_home_city ?? "",

        primaryFuneralHomeState:
          settings?.primary_funeral_home_state ?? "",

        primaryFuneralHomeWebsite:
          settings?.primary_funeral_home_website ?? "",

        primaryFuneralHomeEmail:
          settings?.primary_funeral_home_email ?? "",
          primaryFuneralHomeNotifyAuthorized:
  fromNullableBoolean(
    settings?.primary_funeral_home_notify_authorized ?? null
  ),

        primaryFuneralHomeNotifiedAt:
          settings?.primary_funeral_home_notified_at ?? "",

        primaryFuneralHomeAcknowledgedAt:
          settings?.primary_funeral_home_acknowledged_at ?? "",

        primaryFuneralHomeUnavailableAt:
          settings?.primary_funeral_home_unavailable_at ?? "",

        primaryFuneralHomeUnavailableReason:
          settings?.primary_funeral_home_unavailable_reason ?? "",

        alternateFuneralHomeName:
          settings?.alternate_funeral_home_name ?? "",

        alternateFuneralHomeCity:
          settings?.alternate_funeral_home_city ?? "",

        alternateFuneralHomeState:
          settings?.alternate_funeral_home_state ?? "",

        alternateFuneralHomeWebsite:
          settings?.alternate_funeral_home_website ?? "",

        alternateFuneralHomeEmail:
          settings?.alternate_funeral_home_email ?? "",
          alternateFuneralHomeNotifyAuthorized:
  fromNullableBoolean(
    settings?.alternate_funeral_home_notify_authorized ?? null
  ),

        alternateFuneralHomeActivatedAt:
          settings?.alternate_funeral_home_activated_at ?? "",

        alternateFuneralHomeNotifiedAt:
          settings?.alternate_funeral_home_notified_at ?? "",

        alternateFuneralHomeAcknowledgedAt:
          settings?.alternate_funeral_home_acknowledged_at ?? "",

        // Private legacy instructions remain locked
        // until verified post-death access is unlocked.
        legacyInstructions: postDeathUnlocked
  ? legacy?.legacy_instructions ?? ""
  : "",

privateOwnerMessage: postDeathUnlocked
  ? legacy?.private_owner_message ?? ""
  : "",
      },

      postDeathUnlocked,
    });
  } catch (error) {
    console.error(
      "BACKUP PERSON SETTINGS API ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}