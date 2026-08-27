import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: NextRequest) {
  try {
    const authorization = req.headers.get("authorization") || "";

let ownerUserId: string | null = null;

if (authorization.startsWith("Bearer ")) {
  const accessToken = authorization.replace("Bearer ", "").trim();

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (!userError && user) {
    ownerUserId = user.id;
  }
}
      

    const { memorialId, reason } = await req.json();

    const normalizedMemorialId = Number(memorialId);
    const normalizedReason = String(reason || "").trim();

    if (!Number.isFinite(normalizedMemorialId)) {
      return NextResponse.json(
        { error: "A valid memorial is required." },
        { status: 400 }
      );
    }

    if (!normalizedReason) {
      return NextResponse.json(
        {
          error:
            "Please provide a reason the primary funeral home is unavailable.",
        },
        { status: 400 }
      );
    }

    const { data: memorial, error: memorialError } =
      await supabaseAdmin
        .from("memorials")
        .select("id, owner_id, is_living_preplan")
        .eq("id", normalizedMemorialId)
        .maybeSingle();

    if (memorialError) {
      console.error(
        "ACTIVATE ALTERNATE MEMORIAL LOOKUP ERROR:",
        memorialError
      );

      return NextResponse.json(
        { error: memorialError.message },
        { status: 500 }
      );
    }

    if (!memorial) {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }

    if (memorial.is_living_preplan !== true) {
  return NextResponse.json(
    {
      error:
        "This action is only available for a Living MyEMemorial.",
    },
    { status: 400 }
  );
}

const isOwner =
  Boolean(ownerUserId && memorial.owner_id === ownerUserId);

const accessCheckUrl = new URL(
  `/api/backup-access?memorialId=${normalizedMemorialId}`,
  req.url
);

const accessCheckResponse = await fetch(accessCheckUrl, {
  method: "GET",
  headers: {
    cookie: req.headers.get("cookie") || "",
  },
  cache: "no-store",
});

const accessCheckResult =
  await accessCheckResponse.json();

const hasBackupAccess =
  accessCheckResponse.ok &&
  accessCheckResult?.valid === true;

const { data: legacy, error: legacyError } =
  await supabaseAdmin
    .from("memorial_legacy_handoff")
    .select(
  "death_reported_at, death_verified_at, post_death_access_unlocked_at"
)
    .eq("memorial_id", normalizedMemorialId)
    .maybeSingle();

if (legacyError) {
  console.error(
    "ACTIVATE ALTERNATE LEGACY LOOKUP ERROR:",
    legacyError
  );

  return NextResponse.json(
    { error: legacyError.message },
    { status: 500 }
  );
}

const deathReported =
  Boolean(legacy?.death_reported_at);

const postDeathUnlocked =
  Boolean(legacy?.post_death_access_unlocked_at);

const ownerAllowed =
  isOwner && !postDeathUnlocked;

const backupAllowed =
  hasBackupAccess &&
  deathReported;

if (!ownerAllowed && !backupAllowed) {
  if (hasBackupAccess && !deathReported) {
  return NextResponse.json(
    {
      error:
        "A death must first be reported before the Backup Person may activate the Alternate Funeral Home.",
    },
    { status: 403 }
  );
}

  return NextResponse.json(
    { error: "Unauthorized." },
    { status: 401 }
  );
}

    const { data: settings, error: settingsError } =
      await supabaseAdmin
        .from("memorial_backup_settings")
        .select(`
          id,
          primary_funeral_home_name,
          alternate_funeral_home_name,
          alternate_funeral_home_email,
          primary_funeral_home_unavailable_at,
          alternate_funeral_home_activated_at
        `)
        .eq("memorial_id", normalizedMemorialId)
        .maybeSingle();

    if (settingsError) {
      console.error(
        "ACTIVATE ALTERNATE SETTINGS LOOKUP ERROR:",
        settingsError
      );

      return NextResponse.json(
        { error: settingsError.message },
        { status: 500 }
      );
    }

    if (!settings) {
      return NextResponse.json(
        {
          error:
            "Funeral-home preferences have not been saved for this memorial.",
        },
        { status: 404 }
      );
    }

    if (!settings.primary_funeral_home_name) {
      return NextResponse.json(
        {
          error:
            "A primary funeral home must be recorded before the alternate can be activated.",
        },
        { status: 400 }
      );
    }

    if (!settings.alternate_funeral_home_name) {
      return NextResponse.json(
        {
          error:
            "An alternate funeral home must be recorded before it can be activated.",
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const { error: updateError } =
      await supabaseAdmin
        .from("memorial_backup_settings")
        .update({
  primary_funeral_home_unavailable_at: now,
  primary_funeral_home_unavailable_reason:
    normalizedReason,

  alternate_funeral_home_activated_at: now,

  alternate_funeral_home_notified_at: null,
  alternate_funeral_home_acknowledged_at: null,
  alternate_funeral_home_ack_token_hash: null,
  alternate_funeral_home_ack_token_expires_at: null,
  alternate_funeral_home_notification_email: null,

  updated_at: now,
})
        .eq("id", settings.id);

    if (updateError) {
      console.error(
        "ACTIVATE ALTERNATE UPDATE ERROR:",
        updateError
      );

      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      primaryFuneralHomeUnavailableAt: now,
      primaryFuneralHomeUnavailableReason:
        normalizedReason,
      alternateFuneralHomeActivatedAt: now,
      alternateFuneralHomeName:
        settings.alternate_funeral_home_name,
    });
  } catch (error) {
    console.error(
      "ACTIVATE ALTERNATE FUNERAL HOME API ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}