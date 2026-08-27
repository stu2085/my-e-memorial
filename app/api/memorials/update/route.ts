import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

import Stripe from "stripe";
import { transporter } from "../../../lib/email";
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}

function sanitizeEmailHeader(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function normalizeEmail(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function identityFingerprint(email: string) {
  if (!email) return null;

  return createHash("sha256")
    .update(normalizeEmail(email))
    .digest("hex");
}

function safeAuthorityVersion(value: unknown) {
  const parsed = Number(value ?? 1);

  return Number.isSafeInteger(parsed) && parsed >= 1
    ? parsed
    : 1;
}

async function recordPrimaryAuthorityEvent(input: {
  memorialId: number;
  eventType: string;
  reasonCode: string;
  authorityVersion: number;
  identityEmail: string;
}) {
  const { error } = await supabaseAdmin
    .from("backup_person_authority_events")
    .insert({
      memorial_id: input.memorialId,
      backup_role: "primary",
      event_type: input.eventType,
      actor_type: "owner",
      reason_code: input.reasonCode,
      authority_version: input.authorityVersion,
      identity_fingerprint: identityFingerprint(
        input.identityEmail
      ),
    });

  if (error) {
    console.error(
      "PRIMARY BACKUP AUTHORITY EVENT INSERT ERROR:",
      error
    );
  }
}

export async function POST(req: NextRequest) {
  try {
   const authHeader =
  req.headers.get("authorization");

const token =
  authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

let user = null;

if (authHeader && !token) {
  return NextResponse.json(
    {
      error:
        "Your sign-in session could not be verified. Please sign in again.",
    },
    { status: 401 }
  );
}

if (token) {
  const {
    data: { user: authenticatedUser },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !authenticatedUser) {
    return NextResponse.json(
      {
        error:
          "Your sign-in session has expired or is no longer valid. Please sign in again.",
      },
      { status: 401 }
    );
  }

  user = authenticatedUser;
}


    const {
  memorialId,
  updatePayload,
  giftToken,
  sessionId,
  promoCode,
} = await req.json();

    if (!memorialId || !updatePayload) {
      return NextResponse.json(
        { error: "Missing memorial update information." },
        { status: 400 }
      );
    }

    const { data: memorial, error: memorialError } = await supabaseAdmin
      .from("memorials")
      .select(
  "id, owner_id, is_living_preplan, is_draft, is_published, plan, payment_status, backup_email, full_name"
)
      .eq("id", memorialId)
      .single();

    if (memorialError || !memorial) {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }

    const isOwner =
  !!user && memorial.owner_id === user.id;

let hasBackupAccess = false;

/*
 * Ask the central hardened Backup Person validator for every non-owner.
 * Published former Living MyEMemorials have is_living_preplan=false,
 * but the validator permits that state only after independent death
 * verification + post-death activation.
 */
if (!isOwner) {
  try {
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

    const accessCheckResult =
  await accessCheckResponse.json();

console.log("UPDATE ROUTE BACKUP ACCESS:", {
  memorialId,
  status: accessCheckResponse.status,
  result: accessCheckResult,
  cookiePresent: Boolean(
    req.headers.get("cookie")
  ),
});

hasBackupAccess =
  accessCheckResponse.ok &&
  accessCheckResult?.valid === true;
  } catch (error) {
    console.error(
      "BACKUP ACCESS CHECK ERROR:",
      error
    );

    hasBackupAccess = false;
  }
}

if (!isOwner && !hasBackupAccess) {
  return NextResponse.json(
    { error: "You do not have permission to edit this memorial." },
    { status: 403 }
  );
}
if (!isOwner && hasBackupAccess) {
  const { data: legacyAccess, error: legacyAccessError } =
    await supabaseAdmin
      .from("memorial_legacy_handoff")
      .select("post_death_access_unlocked_at")
      .eq("memorial_id", memorialId)
      .maybeSingle();

  if (legacyAccessError) {
    console.error(
      "BACKUP POST-DEATH ACCESS CHECK ERROR:",
      legacyAccessError
    );

    return NextResponse.json(
      { error: "Backup access could not be verified." },
      { status: 500 }
    );
  }

  const postDeathUnlocked =
    Boolean(
      legacyAccess?.post_death_access_unlocked_at
    );

  if (!postDeathUnlocked) {
    return NextResponse.json(
      {
        error:
          "The Backup Person may view this Living MyEMemorial while the owner is living, but direct editing is locked until post-death access has been independently verified.",
      },
      { status: 403 }
    );
  }
}
const isFinalizingDraft =
  memorial.is_draft === true &&
  updatePayload.is_draft === false;

/*
 * Recovery path for memorials completed under the former Living
 * MyEMemorial rule that set is_draft=false but incorrectly left
 * is_published=false. Only the owner can trigger this by pressing
 * Finish Review again.
 */
const isRecoveringCompletedUnpublishedOwnerMemorial =
  isOwner &&
  memorial.is_draft === false &&
  memorial.is_published !== true &&
  updatePayload.is_draft === false;

const shouldVerifyFinalization =
  isFinalizingDraft ||
  isRecoveringCompletedUnpublishedOwnerMemorial;

let verifiedFinalizationFields: Record<string, unknown> = {};

if (shouldVerifyFinalization) {
  /*
   * Initial draft completion must be performed
   * by the memorial owner.
   */
  if (!isOwner) {
    return NextResponse.json(
      {
        error:
          "Only the memorial owner can complete this draft.",
      },
      { status: 403 }
    );
  }

  /*
   * If the draft already has a server-verified
   * paid/free entitlement, preserve it.
   */
  const alreadyEntitled =
    memorial.payment_status === "paid" ||
    memorial.payment_status === "free_beta";

  if (alreadyEntitled) {
    verifiedFinalizationFields = {
      is_draft: false,
      is_published:
        updatePayload.needs_review === true
          ? false
          : true,
      needs_review:
        updatePayload.needs_review === true,
    };
  } else {
    const normalizedGiftToken = String(
      giftToken || ""
    ).trim();

    const normalizedSessionId = String(
      sessionId || ""
    ).trim();

    const normalizedPromoCode = String(
      promoCode || ""
    )
      .trim()
      .toUpperCase();

    let verifiedPlan: string | null = null;
    let verifiedPaymentStatus: string | null = null;
    let verifiedPaymentSource: string | null = null;
    let verifiedBetaCode: string | null = null;
    let verifiedPromotionCategory: string | null = null;

    /*
     * Verify a claimed Gift.
     */
    if (normalizedGiftToken) {
      const { data: gift, error: giftError } =
        await supabaseAdmin
          .from("memorial_gifts")
          .select(`
            id,
            recipient_email,
            plan,
            status,
            claimed_at,
            claimed_by,
            expires_at
          `)
          .eq("claim_token", normalizedGiftToken)
          .single();

      if (giftError || !gift) {
        return NextResponse.json(
          { error: "This gift could not be verified." },
          { status: 403 }
        );
      }

      if (
        String(gift.recipient_email || "")
          .toLowerCase() !==
        String(user?.email || "")
          .toLowerCase()
      ) {
        return NextResponse.json(
          {
            error:
              "This gift belongs to a different account.",
          },
          { status: 403 }
        );
      }

      if (
        gift.status !== "claimed" ||
        !gift.claimed_at ||
        gift.claimed_by !== user?.id
      ) {
        return NextResponse.json(
          {
            error:
              "This gift has not been claimed by your account.",
          },
          { status: 403 }
        );
      }

      if (
        gift.expires_at &&
        new Date(gift.expires_at).getTime() <
          Date.now()
      ) {
        return NextResponse.json(
          { error: "This gift has expired." },
          { status: 410 }
        );
      }

      if (
        gift.plan !== "basic" &&
        gift.plan !== "plus" &&
        gift.plan !== "premium"
      ) {
        return NextResponse.json(
          { error: "This gift has an invalid memorial plan." },
          { status: 400 }
        );
      }

      verifiedPlan = gift.plan;
      verifiedPaymentStatus = "paid";
      verifiedPaymentSource = "gift";
    }

    /*
     * Verify a Stripe memorial purchase.
     */
    if (!verifiedPlan && normalizedSessionId) {
      const stripeSecretKey =
        process.env.STRIPE_SECRET_KEY;

      if (!stripeSecretKey) {
        return NextResponse.json(
          {
            error:
              "Stripe payment verification is not configured.",
          },
          { status: 500 }
        );
      }

      const stripe = new Stripe(
        stripeSecretKey,
        {
          apiVersion: "2026-04-22.dahlia",
        }
      );

      const stripeSession =
        await stripe.checkout.sessions.retrieve(
          normalizedSessionId
        );

      const stripePlan =
        stripeSession.metadata?.plan;

      const checkoutType =
        stripeSession.metadata?.checkoutType ||
        "standard";

      if (
        stripeSession.payment_status !== "paid" ||
        checkoutType !== "standard"
      ) {
        return NextResponse.json(
          {
            error:
              "This payment session cannot be used to complete this memorial.",
          },
          { status: 403 }
        );
      }

      if (
        stripePlan !== "basic" &&
        stripePlan !== "plus" &&
        stripePlan !== "premium"
      ) {
        return NextResponse.json(
          {
            error:
              "This payment session has an invalid memorial plan.",
          },
          { status: 400 }
        );
      }

      verifiedPlan = stripePlan;
      verifiedPaymentStatus = "paid";
      verifiedPaymentSource = "stripe";
    }

    /*
     * Verify promotional access.
     */
    if (!verifiedPlan && normalizedPromoCode) {
      const { data: promo, error: promoError } =
        await supabaseAdmin
          .from("promo_codes")
          .select(
            "code, allowed_plan, promotion_category, is_active, max_uses, uses_count, expires_at"
          )
          .eq("code", normalizedPromoCode)
          .maybeSingle();

      if (promoError) {
        return NextResponse.json(
          {
            error:
              "Could not verify promotional code.",
          },
          { status: 500 }
        );
      }

      if (!promo || promo.is_active !== true) {
        return NextResponse.json(
          {
            error:
              "Invalid or inactive promotional code.",
          },
          { status: 403 }
        );
      }

      if (
        promo.max_uses &&
        Number(promo.uses_count || 0) >=
          Number(promo.max_uses)
      ) {
        return NextResponse.json(
          {
            error:
              "This promotional code has reached its usage limit.",
          },
          { status: 403 }
        );
      }

      if (
        promo.expires_at &&
        new Date(promo.expires_at).getTime() <
          Date.now()
      ) {
        return NextResponse.json(
          {
            error:
              "This promotional code has expired.",
          },
          { status: 403 }
        );
      }

      if (
        promo.allowed_plan !== "basic" &&
        promo.allowed_plan !== "plus" &&
        promo.allowed_plan !== "premium"
      ) {
        return NextResponse.json(
          {
            error:
              "This promotional code has an invalid plan.",
          },
          { status: 400 }
        );
      }

      verifiedPlan = promo.allowed_plan;
      verifiedPaymentStatus = "free_beta";
      verifiedPaymentSource = "beta_code";
      verifiedBetaCode = normalizedPromoCode;
      verifiedPromotionCategory =
        promo.promotion_category || null;
    }
/*
 * Allow the Free memorial plan.
 */
if (!verifiedPlan && memorial.plan === "free") {
  verifiedPlan = "free";
  verifiedPaymentStatus = "free";
  verifiedPaymentSource = "free_plan";
}
    if (
      !verifiedPlan ||
      !verifiedPaymentStatus ||
      !verifiedPaymentSource
    ) {
      return NextResponse.json(
        {
          error:
            "A valid payment, gift, or promotional code is required before completing this memorial.",
        },
        { status: 403 }
      );
    }

    verifiedFinalizationFields = {
      is_draft: false,
      plan: verifiedPlan,
      payment_status: verifiedPaymentStatus,
      payment_source: verifiedPaymentSource,
      beta_code_used: verifiedBetaCode,
      promotion_category:
        verifiedPromotionCategory,
      is_published:
        updatePayload.needs_review === true
          ? false
          : true,
      needs_review:
        updatePayload.needs_review === true,
    };
  }
}
    const protectedFields = new Set([
  "id",
  "owner_id",
  "plan",
  "payment_status",
  "payment_source",
  "beta_code_used",
  "promotion_category",
  "is_living_preplan",
  "is_published",
  "needs_review",
  "backup_password",
  "created_at",
  "updated_at",
]);

let safeUpdatePayload: Record<string, unknown> =
  Object.fromEntries(
    Object.entries(updatePayload).filter(
      ([key]) => !protectedFields.has(key)
    )
  );

/*
 * Backup Persons may never change the owner's Primary Backup
 * Person identity through the general memorial update route.
 */
if (!isOwner) {
  delete safeUpdatePayload.backup_email;
}

/*
 * After independent death verification, a Backup Person receives only the
 * minimum editing authority needed to complete the memorial:
 *
 * - Date of Death
 * - Obituary
 * - Final Resting Place
 * - Photo Gallery
 * - Video Memories
 *
 * Owner-authored names, biography, family history, places, schools, awards,
 * social links, newspaper articles, favorite music, featured photo, and
 * other owner-controlled fields remain immutable to Backup Person access.
 *
 * This is enforced server-side so a direct API request cannot bypass the
 * Guided Memory Builder's read-only UI.
 */
if (!isOwner && hasBackupAccess) {
  const backupPostDeathAllowedFields = new Set([
    "death_date",

    "obituary",
    "obituary_url",
    "obituary_image_url",

    "final_resting_type",
    "cemetery_name",
    "grave_section",
    "grave_row",
    "grave_plot",
    "grave_lat",
    "grave_lng",
    "grave_directions",
    "map_street",
    "map_city",
    "map_state",
    "map_zip",
    "map_country",
    "ashes_location_description",
    "headstone_photo_1",
    "headstone_photo_2",

    "gallery_photos",
    "gallery_photo_captions",

    "video_urls",
    "video_notes",
    "video_link_urls",
    "video_link_notes",
    "video_link_thumbnail_urls",

    "guided_current_chapter",
  ]);

  safeUpdatePayload = Object.fromEntries(
    Object.entries(safeUpdatePayload).filter(
      ([key]) => backupPostDeathAllowedFields.has(key)
    )
  );
}

const oldBackupEmail =
  normalizeEmail(memorial.backup_email);

const hasPrimaryEmailUpdate =
  isOwner &&
  Object.prototype.hasOwnProperty.call(
    safeUpdatePayload,
    "backup_email"
  );

const newBackupEmail =
  hasPrimaryEmailUpdate
    ? normalizeEmail(
        safeUpdatePayload.backup_email
      )
    : oldBackupEmail;

const primaryIdentityChanged =
  hasPrimaryEmailUpdate &&
  newBackupEmail !== oldBackupEmail;

let primaryAuthorityVersion:
  | number
  | null = null;

let primaryAuthorityChangedAt:
  | string
  | null = null;

let primaryAuthorityEventType:
  | "identity_assigned"
  | "identity_replaced"
  | "identity_removed"
  | null = null;

if (primaryIdentityChanged) {
  /*
   * A changed Primary email is a new identity. The new person
   * must never inherit the previous person's password/session.
   *
   * Keep Primary authority revoked until the owner explicitly
   * supplies a fresh Primary Backup Person password.
   */
  safeUpdatePayload.backup_email =
    newBackupEmail || null;

  safeUpdatePayload.backup_password = null;

  const {
    data: authoritySettings,
    error: authoritySettingsError,
  } = await supabaseAdmin
    .from("memorial_backup_settings")
    .select(
      "primary_backup_authority_version"
    )
    .eq("memorial_id", memorialId)
    .maybeSingle();

  if (authoritySettingsError) {
    console.error(
      "PRIMARY BACKUP AUTHORITY LOOKUP ERROR:",
      authoritySettingsError
    );

    return NextResponse.json(
      { error: authoritySettingsError.message },
      { status: 500 }
    );
  }

  primaryAuthorityVersion =
    safeAuthorityVersion(
      authoritySettings
        ?.primary_backup_authority_version
    ) + 1;

  primaryAuthorityChangedAt =
    new Date().toISOString();

  primaryAuthorityEventType =
    oldBackupEmail && newBackupEmail
      ? "identity_replaced"
      : newBackupEmail
        ? "identity_assigned"
        : "identity_removed";
}

const shouldSendBackupPersonEmail =
  isOwner &&
  memorial.is_living_preplan === true &&
  Boolean(newBackupEmail) &&
  primaryIdentityChanged;
  const memorialPersonName = String(
  safeUpdatePayload.full_name ||
  memorial.full_name ||
  "the memorial owner"
).trim();

const memorialPersonNameHtml =
  escapeHtml(memorialPersonName);

const memorialPersonNameSubject =
  sanitizeEmailHeader(memorialPersonName);

let backupPersonEmailStatus:
  | "not_needed"
  | "sent"
  | "failed" = "not_needed";

let backupPersonEmailWarning: string | null = null;

console.log("MEMORIAL UPDATE REQUEST:", {
  time: new Date().toISOString(),
  memorialId,
  obituary: safeUpdatePayload.obituary,
  cemetery_name: safeUpdatePayload.cemetery_name,
  grave_directions: safeUpdatePayload.grave_directions,
  final_resting_type: safeUpdatePayload.final_resting_type,
  guided_current_chapter:
    safeUpdatePayload.guided_current_chapter,
});
const { error: updateError } = await supabaseAdmin
  .from("memorials")
  .update({
  ...safeUpdatePayload,
  ...verifiedFinalizationFields,
  updated_at: new Date().toISOString(),
})
  .eq("id", memorialId);

    if (updateError) {
  return NextResponse.json(
    { error: updateError.message },
    { status: 500 }
  );
}

if (
  primaryIdentityChanged &&
  primaryAuthorityVersion &&
  primaryAuthorityChangedAt &&
  primaryAuthorityEventType
) {
  const primaryRevocationReason =
    newBackupEmail
      ? "primary_identity_changed_requires_reappointment"
      : "primary_identity_removed";

  const { error: authorityUpdateError } =
    await supabaseAdmin
      .from("memorial_backup_settings")
      .upsert(
        {
          memorial_id: memorialId,
          primary_backup_authority_version:
            primaryAuthorityVersion,
          primary_backup_revoked_at:
            primaryAuthorityChangedAt,
          primary_backup_revoked_by:
            "owner",
          primary_backup_revocation_reason:
            primaryRevocationReason,
          updated_at:
            primaryAuthorityChangedAt,
        },
        {
          onConflict: "memorial_id",
        }
      );

  if (authorityUpdateError) {
    console.error(
      "PRIMARY BACKUP AUTHORITY UPDATE ERROR:",
      authorityUpdateError
    );

    return NextResponse.json(
      {
        error:
          "The memorial was saved, but the Primary Backup Person authority state could not be updated. Please try again before relying on Backup Person access.",
      },
      { status: 500 }
    );
  }

  /*
   * Immediately invalidate reminder state for the old Primary
   * identity. Fresh password/reappointment starts a new cycle.
   */
  const { error: reminderStateError } =
    await supabaseAdmin
      .from("backup_person_reminder_state")
      .update({
        reminders_disabled_at:
          primaryAuthorityChangedAt,
        disabled_reason:
          primaryRevocationReason,
        preference_token_hash: null,
        preference_token_expires_at: null,
        updated_at:
          primaryAuthorityChangedAt,
      })
      .eq("memorial_id", memorialId)
      .eq("backup_role", "primary");

  if (reminderStateError) {
    console.error(
      "PRIMARY BACKUP REMINDER STATE UPDATE ERROR:",
      reminderStateError
    );
  }

  await recordPrimaryAuthorityEvent({
    memorialId: Number(memorialId),
    eventType:
      primaryAuthorityEventType,
    reasonCode:
      primaryRevocationReason,
    authorityVersion:
      primaryAuthorityVersion,
    identityEmail:
      newBackupEmail || oldBackupEmail,
  });
}

const { data: verifyUpdate, error: verifyUpdateError } =
  await supabaseAdmin
    .from("memorials")
    .select("obituary, cemetery_name, grave_directions")
    .eq("id", memorialId)
    .single();

console.log("POST-DEATH DB VERIFY:", {
  verifyUpdate,
  verifyUpdateError,
});
if (shouldSendBackupPersonEmail) {
  try {
    await transporter.sendMail({
  from: `"MyEMemorial" <help@myememorial.com>`,
  to: newBackupEmail,
  subject: `You Have Been Named as ${memorialPersonNameSubject}'s MyEMemorial Backup Person`,
  html: `
    <p>Hello,</p>

    <p>
      <strong>${memorialPersonNameHtml}</strong> has named you as the
      backup person for their <strong>Living MyEMemorial</strong>
      on MyEMemorial.
    </p>

    <p>
      There is nothing you need to do right now.
    </p>

    <p>
      As their backup person, you help ensure that
      ${memorialPersonNameHtml}'s Living MyEMemorial can be properly
      managed in the future when needed.
    </p>

    <p>
      If your backup access is activated in the future, you will
      receive additional information about how to access and manage
      the memorial.
    </p>

    <p>
      If ${memorialPersonNameHtml} dies and a funeral home needs to be contacted,
      MyEMemorial may provide your name, phone number, and email address to
      the funeral home ${memorialPersonNameHtml} selected so they can contact you
      regarding funeral arrangements and death verification when appropriate.
    </p>

    <p>
      This information is being provided to you now so that, if that occurs
      in the future, the funeral home's contact will not come as a surprise.
      There is nothing you need to do at this time.
    </p>

    <p>
  Thank you,<br />
  MyEMemorial
</p>

<p>
  <a
    href="https://www.myememorial.com"
    target="_blank"
    rel="noopener noreferrer"
    style="text-decoration:none;"
  >
    <img
      src="https://www.myememorial.com/myememorial-logo.png"
      alt="MyEMemorial"
      width="180"
      style="display:block; margin-top:16px; border:0;"
    />
  </a>
</p>


  `,
});

    backupPersonEmailStatus = "sent";
  } catch (emailError) {
    console.error(
      "BACKUP PERSON EMAIL ERROR:",
      emailError
    );

    backupPersonEmailStatus = "failed";
    backupPersonEmailWarning =
      "The memorial was saved, but the Backup Person notification email could not be sent.";
  }
}

return NextResponse.json({
  success: true,
  backupPersonEmailStatus,
  warning: backupPersonEmailWarning,
});
  } catch (err) {
    console.error("MEMORIAL UPDATE API ERROR:", err);
    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}