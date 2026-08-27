import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function toNullableBoolean(value: unknown) {
  if (value === "yes" || value === true) return true;
  if (value === "no" || value === false) return false;

  return null;
}

function hasLegacyInstructionsEntitlement(memorial: {
  plan?: string | null;
  payment_status?: string | null;
}) {
  const hasEligiblePlan =
    memorial.plan === "basic" ||
    memorial.plan === "plus" ||
    memorial.plan === "premium";

  const hasEligiblePaymentStatus =
    memorial.payment_status === "paid" ||
    memorial.payment_status === "free_beta";

  return hasEligiblePlan && hasEligiblePaymentStatus;
}

function normalizeEmail(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function identityFingerprint(email: string) {
  if (!email) return null;

  return createHash("sha256")
    .update(email)
    .digest("hex");
}

async function recordAuthorityEvent(input: {
  memorialId: number;
  backupRole: "primary" | "secondary";
  eventType: string;
  actorType: string;
  reasonCode?: string | null;
  authorityVersion?: number | null;
  identityEmail?: string | null;
}) {
  const { error } = await supabaseAdmin
    .from("backup_person_authority_events")
    .insert({
      memorial_id: input.memorialId,
      backup_role: input.backupRole,
      event_type: input.eventType,
      actor_type: input.actorType,
      reason_code: input.reasonCode || null,
      authority_version:
        input.authorityVersion ?? null,
      identity_fingerprint:
        identityFingerprint(
          normalizeEmail(input.identityEmail)
        ),
    });

  if (error) {
    console.error(
      "BACKUP AUTHORITY EVENT INSERT ERROR:",
      error
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Your sign-in could not be verified." },
        { status: 401 }
      );
    }

    const {
      memorialId,
      backupPhone,

      secondaryBackupName,
      secondaryBackupEmail,
      secondaryBackupPhone,

      hasWill,
      willLocation,
willAttorneyOffice,
hasLifeInsurance,
lifeInsuranceLocation,
      hasExecutor,
      primaryBackupIsExecutor,

      hasFuneralDecisionDesignee,
      primaryBackupIsFuneralDesignee,
      funeralDecisionPersonName,
      funeralDecisionPersonRelationship,
      funeralAuthorityDocumentLocation,

      primaryFuneralHomeName,
      primaryFuneralHomeCity,
      primaryFuneralHomeState,
      primaryFuneralHomeWebsite,
      primaryFuneralHomeNotifyAuthorized,

      alternateFuneralHomeName,
      alternateFuneralHomeCity,
      alternateFuneralHomeState,
      alternateFuneralHomeWebsite,
      alternateFuneralHomeNotifyAuthorized,
primaryFuneralHomeEmail,

alternateFuneralHomeEmail,
legacyInstructions,
privateOwnerMessage,
} = await req.json();;

    const normalizedMemorialId = Number(memorialId);

    if (!Number.isFinite(normalizedMemorialId) || normalizedMemorialId <= 0) {
      return NextResponse.json(
        { error: "A valid memorial ID is required." },
        { status: 400 }
      );
    }

    const { data: memorial, error: memorialError } =
      await supabaseAdmin
        .from("memorials")
        .select("id, owner_id, is_living_preplan, plan, payment_status")
        .eq("id", normalizedMemorialId)
        .single();

    if (memorialError || !memorial) {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }

    if (memorial.owner_id !== user.id) {
      return NextResponse.json(
        {
          error:
            "Only the memorial owner can change Backup Person and Legacy Instructions.",
        },
        { status: 403 }
      );
    }

    if (memorial.is_living_preplan !== true) {
      return NextResponse.json(
        {
          error:
            "These Backup Person settings are only available for Living MyEMemorials.",
        },
        { status: 400 }
      );
    }

    if (!hasLegacyInstructionsEntitlement(memorial)) {
      return NextResponse.json(
        {
          error:
            "Legacy Instructions are not available for this memorial.",
        },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();

    /*
     * #18 Secondary Backup Person reassignment safety.
     *
     * A replacement Secondary Backup Person must never inherit
     * the prior person's password or authority state.
     */
    const normalizedSecondaryEmail =
      normalizeEmail(secondaryBackupEmail) || null;

    const {
      data: existingBackupSettings,
      error: existingBackupSettingsError,
    } = await supabaseAdmin
      .from("memorial_backup_settings")
      .select(
        "secondary_backup_email, secondary_backup_activated_at, secondary_backup_authority_version, secondary_backup_revoked_at"
      )
      .eq("memorial_id", normalizedMemorialId)
      .maybeSingle();

    if (existingBackupSettingsError) {
      console.error(
        "BACKUP SETTINGS EXISTING AUTHORITY LOOKUP ERROR:",
        existingBackupSettingsError
      );

      return NextResponse.json(
        { error: existingBackupSettingsError.message },
        { status: 500 }
      );
    }

    const existingSecondaryEmail =
      normalizeEmail(
        existingBackupSettings?.secondary_backup_email
      );

    const nextSecondaryEmail =
      normalizeEmail(normalizedSecondaryEmail);

    const secondaryIdentityChanged =
      existingSecondaryEmail !== nextSecondaryEmail;

    const existingSecondaryWasActive =
      Boolean(
        existingBackupSettings
          ?.secondary_backup_activated_at
      );

    const currentSecondaryAuthorityVersion =
      Number(
        existingBackupSettings
          ?.secondary_backup_authority_version ?? 1
      );

    const safeCurrentSecondaryAuthorityVersion =
      Number.isSafeInteger(
        currentSecondaryAuthorityVersion
      ) &&
      currentSecondaryAuthorityVersion >= 1
        ? currentSecondaryAuthorityVersion
        : 1;

    const nextSecondaryAuthorityVersion =
      secondaryIdentityChanged
        ? safeCurrentSecondaryAuthorityVersion + 1
        : safeCurrentSecondaryAuthorityVersion;

    const backupSettingsPayload: Record<
      string,
      unknown
    > = {
      memorial_id: normalizedMemorialId,

      backup_phone:
        String(backupPhone || "").trim() || null,

      secondary_backup_name:
        String(secondaryBackupName || "").trim() || null,

      secondary_backup_email:
        normalizedSecondaryEmail,

      secondary_backup_phone:
        String(secondaryBackupPhone || "").trim() || null,

      has_will: toNullableBoolean(hasWill),
      will_location:
  String(willLocation || "").trim() || null,

will_attorney_office:
  String(willAttorneyOffice || "").trim() || null,

has_life_insurance:
  toNullableBoolean(hasLifeInsurance),

life_insurance_location:
  String(lifeInsuranceLocation || "").trim() || null,
      has_executor: toNullableBoolean(hasExecutor),

      primary_backup_is_executor:
        toNullableBoolean(primaryBackupIsExecutor),

      has_funeral_decision_designee:
        toNullableBoolean(hasFuneralDecisionDesignee),

      primary_backup_is_funeral_designee:
        toNullableBoolean(primaryBackupIsFuneralDesignee),

      funeral_decision_person_name:
        String(funeralDecisionPersonName || "").trim() || null,

      funeral_decision_person_relationship:
        String(
          funeralDecisionPersonRelationship || ""
        ).trim() || null,

      funeral_authority_document_location:
        String(
          funeralAuthorityDocumentLocation || ""
        ).trim() || null,

      primary_funeral_home_name:
        String(primaryFuneralHomeName || "").trim() || null,

      primary_funeral_home_city:
        String(primaryFuneralHomeCity || "").trim() || null,

      primary_funeral_home_state:
        String(primaryFuneralHomeState || "").trim() || null,

      primary_funeral_home_website:
        String(primaryFuneralHomeWebsite || "").trim() || null,

      primary_funeral_home_notify_authorized:
        primaryFuneralHomeNotifyAuthorized === "yes",

      alternate_funeral_home_name:
        String(alternateFuneralHomeName || "").trim() || null,

      alternate_funeral_home_city:
        String(alternateFuneralHomeCity || "").trim() || null,

      alternate_funeral_home_state:
        String(alternateFuneralHomeState || "").trim() || null,

      alternate_funeral_home_website:
        String(alternateFuneralHomeWebsite || "").trim() || null,
primary_funeral_home_email:
  String(primaryFuneralHomeEmail || "")
    .trim()
    .toLowerCase() || null,



alternate_funeral_home_email:
  String(alternateFuneralHomeEmail || "")
    .trim()
    .toLowerCase() || null,


      alternate_funeral_home_notify_authorized:
        alternateFuneralHomeNotifyAuthorized === "yes",

      updated_at: now,
    };

    if (secondaryIdentityChanged) {
      /*
       * Always discard the prior Secondary credential.
       * A new/replacement person must receive a fresh password.
       */
      backupSettingsPayload.secondary_backup_password =
        null;

      backupSettingsPayload.secondary_backup_authority_version =
        nextSecondaryAuthorityVersion;

      if (existingSecondaryWasActive) {
        /*
         * Preserve the activated marker so the system does NOT
         * automatically fall back to Primary. The replacement
         * Secondary remains blocked until explicitly activated
         * again in the #18 activation step.
         */
        backupSettingsPayload.secondary_backup_revoked_at =
          now;
        backupSettingsPayload.secondary_backup_revoked_by =
          "owner";
        backupSettingsPayload.secondary_backup_revocation_reason =
          "secondary_identity_changed_requires_reactivation";
      } else {
        /*
         * A standby Secondary replacement starts as a clean,
         * non-revoked standby identity.
         */
        backupSettingsPayload.secondary_backup_revoked_at =
          null;
        backupSettingsPayload.secondary_backup_revoked_by =
          null;
        backupSettingsPayload.secondary_backup_revocation_reason =
          null;
      }
    }

    const { error: settingsError } =
      await supabaseAdmin
        .from("memorial_backup_settings")
        .upsert(backupSettingsPayload, {
          onConflict: "memorial_id",
        });

    if (settingsError) {
      console.error(
        "BACKUP SETTINGS SAVE ERROR:",
        settingsError
      );

      return NextResponse.json(
        { error: settingsError.message },
        { status: 500 }
      );
    }

    if (secondaryIdentityChanged) {
      const hadPriorSecondary =
        Boolean(existingSecondaryEmail);
      const hasNewSecondary =
        Boolean(nextSecondaryEmail);

      const eventType =
        hadPriorSecondary && hasNewSecondary
          ? "identity_replaced"
          : hasNewSecondary
            ? "identity_assigned"
            : "identity_removed";

      await recordAuthorityEvent({
        memorialId: normalizedMemorialId,
        backupRole: "secondary",
        eventType,
        actorType: "owner",
        reasonCode: existingSecondaryWasActive
          ? "active_secondary_identity_change_requires_reactivation"
          : "owner_changed_secondary_identity",
        authorityVersion:
          nextSecondaryAuthorityVersion,
        identityEmail:
          nextSecondaryEmail ||
          existingSecondaryEmail,
      });
    }

    const legacyPayload = {
  memorial_id: normalizedMemorialId,

  legacy_instructions:
    String(legacyInstructions || "").trim() || null,

  private_owner_message:
    String(privateOwnerMessage || "").trim() || null,

  updated_at: now,
};

    const { error: legacyError } =
      await supabaseAdmin
        .from("memorial_legacy_handoff")
        .upsert(legacyPayload, {
          onConflict: "memorial_id",
        });

    if (legacyError) {
      console.error(
        "LEGACY HANDOFF SAVE ERROR:",
        legacyError
      );

      return NextResponse.json(
        { error: legacyError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "BACKUP SETTINGS API ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}
function fromNullableBoolean(value: boolean | null) {
  if (value === true) return "yes";
  if (value === false) return "no";

  return "";
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Your sign-in could not be verified." },
        { status: 401 }
      );
    }

    const memorialId = Number(
      req.nextUrl.searchParams.get("memorialId")
    );

    if (!Number.isFinite(memorialId) || memorialId <= 0) {
      return NextResponse.json(
        { error: "A valid memorial ID is required." },
        { status: 400 }
      );
    }

    const { data: memorial, error: memorialError } =
      await supabaseAdmin
        .from("memorials")
        .select("id, owner_id, is_living_preplan, plan, payment_status")
        .eq("id", memorialId)
        .single();

    if (memorialError || !memorial) {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }

    if (memorial.owner_id !== user.id) {
      return NextResponse.json(
        {
          error:
            "Only the memorial owner can view these private Backup Person settings.",
        },
        { status: 403 }
      );
    }

    if (memorial.is_living_preplan !== true) {
      return NextResponse.json(
        {
          error:
            "These settings are only available for Living MyEMemorials.",
        },
        { status: 400 }
      );
    }

    if (!hasLegacyInstructionsEntitlement(memorial)) {
      return NextResponse.json(
        {
          error:
            "Legacy Instructions are not available for this memorial.",
        },
        { status: 403 }
      );
    }

    const { data: settings, error: settingsError } =
      await supabaseAdmin
        .from("memorial_backup_settings")
        .select("*")
        .eq("memorial_id", memorialId)
        .maybeSingle();

    if (settingsError) {
      console.error(
        "BACKUP SETTINGS LOAD ERROR:",
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
        .select(
  "legacy_instructions, private_owner_message, post_death_access_unlocked_at"
)
        .eq("memorial_id", memorialId)
        .maybeSingle();
        const postDeathUnlocked =
  Boolean(legacy?.post_death_access_unlocked_at);

    if (legacyError) {
      console.error(
        "LEGACY HANDOFF LOAD ERROR:",
        legacyError
      );

      return NextResponse.json(
        { error: legacyError.message },
        { status: 500 }
      );
    }

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

        primaryBackupRevokedAt:
          settings?.primary_backup_revoked_at ?? "",

        secondaryBackupRevokedAt:
          settings?.secondary_backup_revoked_at ?? "",

        hasWill:
          fromNullableBoolean(settings?.has_will ?? null),
          willLocation:
  settings?.will_location ?? "",

willAttorneyOffice:
  settings?.will_attorney_office ?? "",

hasLifeInsurance:
  fromNullableBoolean(
    settings?.has_life_insurance ?? null
  ),

lifeInsuranceLocation:
  settings?.life_insurance_location ?? "",

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

        primaryFuneralHomeEmailVerified:
          settings?.primary_funeral_home_email_verified === true,

        primaryFuneralHomeNotifyAuthorized:
          settings?.primary_funeral_home_notify_authorized === true
            ? "yes"
            : "no",
primaryFuneralHomeNotifiedAt:
  settings?.primary_funeral_home_notified_at ?? "",

primaryFuneralHomeAcknowledgedAt:
  settings?.primary_funeral_home_acknowledged_at ?? "",
  primaryFuneralHomeUnavailableAt:
  settings?.primary_funeral_home_unavailable_at ?? "",

primaryFuneralHomeUnavailableReason:
  settings?.primary_funeral_home_unavailable_reason ?? "",

alternateFuneralHomeActivatedAt:
  settings?.alternate_funeral_home_activated_at ?? "",
  alternateFuneralHomeNotifiedAt:
  settings?.alternate_funeral_home_notified_at ?? "",

alternateFuneralHomeAcknowledgedAt:
  settings?.alternate_funeral_home_acknowledged_at ?? "",
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

        alternateFuneralHomeEmailVerified:
          settings?.alternate_funeral_home_email_verified === true,

        alternateFuneralHomeNotifyAuthorized:
          settings?.alternate_funeral_home_notify_authorized === true
            ? "yes"
            : "no",

        legacyInstructions:
  legacy?.legacy_instructions ?? "",

privateOwnerMessage:
  legacy?.private_owner_message ?? "",
      },
    });
  } catch (error) {
    console.error(
      "BACKUP SETTINGS GET ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}