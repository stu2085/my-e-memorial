import { after, NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createHash,
  createHmac,
} from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    const rawToken = String(token || "").trim();

    if (!rawToken) {
      return NextResponse.json(
        { error: "Acknowledgement token is required." },
        { status: 400 }
      );
    }

    const tokenHash = createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const { data: settings, error: settingsError } =
      await supabaseAdmin
        .from("memorial_backup_settings")
        .select(`
          id,
          memorial_id,

          primary_funeral_home_name,
          primary_funeral_home_ack_token_hash,
          primary_funeral_home_ack_token_expires_at,
          primary_funeral_home_acknowledged_at,

          alternate_funeral_home_name,
          alternate_funeral_home_ack_token_hash,
          alternate_funeral_home_ack_token_expires_at,
          alternate_funeral_home_acknowledged_at
        `)
        .or(
          `primary_funeral_home_ack_token_hash.eq.${tokenHash},alternate_funeral_home_ack_token_hash.eq.${tokenHash}`
        )
        .maybeSingle();

    if (settingsError) {
      console.error(
        "FUNERAL HOME ACKNOWLEDGEMENT LOOKUP ERROR:",
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
            "This acknowledgement link is invalid or has already been used.",
        },
        { status: 404 }
      );
    }

    const isPrimary =
      settings.primary_funeral_home_ack_token_hash ===
      tokenHash;

    const funeralHomeName = isPrimary
      ? settings.primary_funeral_home_name
      : settings.alternate_funeral_home_name;

    const expiresAt = isPrimary
      ? settings.primary_funeral_home_ack_token_expires_at
      : settings.alternate_funeral_home_ack_token_expires_at;

    const alreadyAcknowledged = isPrimary
      ? settings.primary_funeral_home_acknowledged_at
      : settings.alternate_funeral_home_acknowledged_at;

    if (alreadyAcknowledged) {
      return NextResponse.json(
        {
          success: true,
          alreadyAcknowledged: true,
          funeralHomeName,
          message:
            "This funeral home preference has already been acknowledged.",
        },
        { status: 200 }
      );
    }

    if (
      !expiresAt ||
      new Date(expiresAt).getTime() < Date.now()
    ) {
      return NextResponse.json(
        {
          error:
            "This acknowledgement link has expired.",
        },
        { status: 410 }
      );
    }

    const now = new Date().toISOString();

    const updatePayload = isPrimary
      ? {
          primary_funeral_home_acknowledged_at: now,
          primary_funeral_home_ack_token_hash: null,
          primary_funeral_home_ack_token_expires_at: null,
          updated_at: now,
        }
      : {
          alternate_funeral_home_acknowledged_at: now,
          alternate_funeral_home_ack_token_hash: null,
          alternate_funeral_home_ack_token_expires_at: null,
          updated_at: now,
        };

    const { error: updateError } =
      await supabaseAdmin
        .from("memorial_backup_settings")
        .update(updatePayload)
        .eq("id", settings.id);

    if (updateError) {
      console.error(
        "FUNERAL HOME ACKNOWLEDGEMENT UPDATE ERROR:",
        updateError
      );

      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

let deathVerificationEmailStatus:
  | "not_needed"
  | "scheduled"
  | "sent"
  | "already_verified"
  | "failed" = "not_needed";

let deathVerificationWarning: string | null = null;

if (!isPrimary) {
  const {
    data: handoff,
    error: handoffError,
  } = await supabaseAdmin
    .from("memorial_legacy_handoff")
    .select(
      "death_reported_at, death_verified_at"
    )
    .eq(
      "memorial_id",
      settings.memorial_id
    )
    .maybeSingle();

  if (handoffError) {
    console.error(
      "ALTERNATE ACKNOWLEDGEMENT HANDOFF LOOKUP ERROR:",
      handoffError
    );

    deathVerificationEmailStatus = "failed";
    deathVerificationWarning =
      "The funeral-home preference was acknowledged, but MyEMemorial could not check whether a death-verification email needed to be sent.";
  } else if (
    handoff?.death_reported_at &&
    !handoff?.death_verified_at
  ) {
    const internalSecret =
      process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!internalSecret) {
      deathVerificationEmailStatus = "failed";
      deathVerificationWarning =
        "The funeral-home preference was acknowledged, but the death-verification email could not be requested.";
    } else {
      const internalSignature =
        createHmac(
          "sha256",
          internalSecret
        )
          .update(
            `request-death-verification:${settings.memorial_id}`
          )
          .digest("hex");

      const requestUrl = req.url;
      const memorialId = settings.memorial_id;

      /*
       * The acknowledgement itself is already safely stored above.
       * Do not keep the funeral-home browser waiting while the separate
       * death-verification email route performs its network/email work.
       * Next.js after() lets that follow-up continue after this response
       * is returned, so the page can immediately show "Preference Acknowledged."
       */
      deathVerificationEmailStatus = "scheduled";

      after(async () => {
        try {
          const verificationResponse =
            await fetch(
              new URL(
                "/api/funeral-home/request-death-verification",
                requestUrl
              ),
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                  "x-myememorial-internal-signature":
                    internalSignature,
                },
                body: JSON.stringify({
                  memorialId,
                }),
                cache: "no-store",
              }
            );

          const verificationResult =
            await verificationResponse.json();

          if (!verificationResponse.ok) {
            console.error(
              "ALTERNATE DEATH VERIFICATION REQUEST ERROR:",
              verificationResult
            );
            return;
          }

          console.log(
            "ALTERNATE DEATH VERIFICATION REQUEST COMPLETE:",
            {
              memorialId,
              alreadyVerified:
                verificationResult?.alreadyVerified === true,
              emailStatus:
                verificationResult?.emailStatus ||
                (verificationResult?.sent === true
                  ? "sent"
                  : "completed"),
            }
          );
        } catch (verificationError) {
          console.error(
            "ALTERNATE DEATH VERIFICATION REQUEST ERROR:",
            verificationError
          );
        }
      });
    }
  } else if (handoff?.death_verified_at) {
    deathVerificationEmailStatus =
      "already_verified";
  }
}
    return NextResponse.json({
      success: true,
      alreadyAcknowledged: false,
      funeralHomeName,
      funeralHomeType: isPrimary
        ? "primary"
        : "alternate",
      deathVerificationEmailStatus,
      warning: deathVerificationWarning,
      message:
        "Thank you. The funeral-home preference has been acknowledged.",
    });
  } catch (error) {
    console.error(
      "FUNERAL HOME ACKNOWLEDGEMENT API ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}