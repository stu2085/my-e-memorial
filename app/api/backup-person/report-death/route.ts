import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

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

type BackupRole = "primary" | "secondary";


type DeathVerificationEmailResult = {
  emailStatus:
    | "sent"
    | "already_verified"
    | "failed";
  warning: string | null;
};

async function requestDeathVerificationEmail(
  req: NextRequest,
  memorialId: number
): Promise<DeathVerificationEmailResult> {
  const internalSecret =
    process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!internalSecret) {
    return {
      emailStatus: "failed",
      warning:
        "The death report is recorded, but death verification is not configured.",
    };
  }

  const internalSignature = createHmac(
    "sha256",
    internalSecret
  )
    .update(
      `request-death-verification:${memorialId}`
    )
    .digest("hex");

  try {
    const verificationResponse = await fetch(
      new URL(
        "/api/funeral-home/request-death-verification",
        req.url
      ),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-myememorial-internal-signature":
            internalSignature,
        },
        body: JSON.stringify({ memorialId }),
        cache: "no-store",
      }
    );

    const verificationResult =
      await verificationResponse.json();

    if (!verificationResponse.ok) {
      return {
        emailStatus: "failed",
        warning:
          verificationResult?.error ||
          "The death report is recorded, but the funeral-home death-verification email could not be sent.",
      };
    }

    if (
      verificationResult?.alreadyVerified === true
    ) {
      return {
        emailStatus: "already_verified",
        warning: null,
      };
    }

    if (
      verificationResult?.emailStatus === "sent" ||
      verificationResult?.sent === true
    ) {
      return {
        emailStatus: "sent",
        warning: null,
      };
    }

    return {
      emailStatus: "failed",
      warning:
        "The death report is recorded, but MyEMemorial could not confirm that the funeral-home death-verification email was sent.",
    };
  } catch (verificationError) {
    console.error(
      "DEATH VERIFICATION REQUEST ERROR:",
      verificationError
    );

    return {
      emailStatus: "failed",
      warning:
        "The death report is recorded, but the funeral-home death-verification request could not be completed.",
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const memorialId = Number(body?.memorialId);
    const deathReportNote = String(
      body?.deathReportNote || ""
    ).trim();

    if (
      !Number.isFinite(memorialId) ||
      memorialId <= 0
    ) {
      return NextResponse.json(
        { error: "A valid memorial ID is required." },
        { status: 400 }
      );
    }

    if (deathReportNote.length > 1000) {
      return NextResponse.json(
        {
          error:
            "The death report note cannot be longer than 1,000 characters.",
        },
        { status: 400 }
      );
    }

    /*
     * Load the memorial first so Living MyEMemorial and paid
     * Legacy Instructions gating remains enforced here.
     */
    const { data: memorial, error: memorialError } =
      await supabaseAdmin
        .from("memorials")
        .select(
          "id, owner_id, is_living_preplan, backup_email, full_name, plan, payment_status"
        )
        .eq("id", memorialId)
        .single();

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
            "A death report can only be submitted for a Living MyEMemorial.",
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

    /*
     * #18: Delegate ALL Backup Person session validation to the
     * central validator.
     *
     * /api/backup-access now enforces:
     * - memorial binding
     * - exact four-part hardened cookie format
     * - one-hour session age
     * - active Primary / Secondary role
     * - current identity and password
     * - current authority version
     * - immediate revocation
     *
     * This removes the older duplicated cookie validator from
     * this route so a revoked Backup Person cannot still report
     * a death through stale session logic.
     *
     * A death report still does NOT unlock the memorial.
     */
    const accessCheckUrl = new URL(
      `/api/backup-access?memorialId=${encodeURIComponent(
        String(memorialId)
      )}`,
      req.url
    );

    const accessCheckResponse = await fetch(
      accessCheckUrl,
      {
        method: "GET",
        headers: {
          cookie: req.headers.get("cookie") || "",
        },
        cache: "no-store",
      }
    );

    const accessCheckResult =
      await accessCheckResponse.json();

    if (
      !accessCheckResponse.ok ||
      accessCheckResult?.valid !== true
    ) {
      return NextResponse.json(
        {
          error:
            "Authorized Backup Person access is required.",
        },
        { status: 403 }
      );
    }

    const verifiedBackupRole =
      accessCheckResult?.backupRole;

    if (
      verifiedBackupRole !== "primary" &&
      verifiedBackupRole !== "secondary"
    ) {
      return NextResponse.json(
        {
          error:
            "Authorized Backup Person access is required.",
        },
        { status: 403 }
      );
    }

    const activeBackupRole: BackupRole =
      verifiedBackupRole;

    /*
     * Preserve the existing audit behavior that records the
     * currently authorized Backup Person email with the death
     * report. No password/hash is loaded here anymore.
     */
    let activeEmail =
      String(memorial.backup_email || "")
        .trim()
        .toLowerCase();

    if (activeBackupRole === "secondary") {
      const {
        data: backupSettings,
        error: backupSettingsError,
      } = await supabaseAdmin
        .from("memorial_backup_settings")
        .select("secondary_backup_email")
        .eq("memorial_id", memorialId)
        .maybeSingle();

      if (backupSettingsError) {
        console.error(
          "REPORT DEATH BACKUP SETTINGS ERROR:",
          backupSettingsError
        );

        return NextResponse.json(
          {
            error:
              "Backup Person access could not be verified.",
          },
          { status: 500 }
        );
      }

      activeEmail =
        String(
          backupSettings
            ?.secondary_backup_email || ""
        )
          .trim()
          .toLowerCase();
    }

    /*
     * Check whether a report has already been submitted.
     * We do not overwrite the original report.
     */
    const {
      data: existingHandoff,
      error: existingHandoffError,
    } = await supabaseAdmin
      .from("memorial_legacy_handoff")
      .select(
        "memorial_id, death_reported_at, death_reported_by, death_report_note"
      )
      .eq("memorial_id", memorialId)
      .maybeSingle();

    if (existingHandoffError) {
      console.error(
        "DEATH REPORT LOAD ERROR:",
        existingHandoffError
      );

      return NextResponse.json(
        { error: existingHandoffError.message },
        { status: 500 }
      );
    }

    if (existingHandoff?.death_reported_at) {
      const verificationEmailResult =
        await requestDeathVerificationEmail(
          req,
          memorialId
        );

      if (
        verificationEmailResult.emailStatus ===
        "failed"
      ) {
        return NextResponse.json(
          {
            error:
              verificationEmailResult.warning ||
              "The death report is already recorded, but the funeral-home death-verification email could not be sent.",
            alreadyReported: true,
            deathReportedAt:
              existingHandoff.death_reported_at,
            deathVerificationEmailStatus:
              verificationEmailResult.emailStatus,
          },
          { status: 409 }
        );
      }

      return NextResponse.json({
        success: true,
        alreadyReported: true,
        deathReportedAt:
          existingHandoff.death_reported_at,
        deathVerificationEmailStatus:
          verificationEmailResult.emailStatus,
      });
    }

    const now = new Date().toISOString();

    /*
     * #14: record the identity that is CURRENTLY
     * authorized — Primary before failover, Secondary
     * after failover.
     */
    const reportedBy =
      activeEmail ||
      `Authorized ${activeBackupRole} Backup Person`;

    const { error: saveError } =
      await supabaseAdmin
        .from("memorial_legacy_handoff")
        .upsert(
          {
            memorial_id: memorialId,
            death_reported_at: now,
            death_reported_by: reportedBy,
            death_report_note:
              deathReportNote || null,
            updated_at: now,
          },
          {
            onConflict: "memorial_id",
          }
        );

    if (saveError) {
      console.error(
        "DEATH REPORT SAVE ERROR:",
        saveError
      );

      return NextResponse.json(
        { error: saveError.message },
        { status: 500 }
      );
    }

    /*
     * IMPORTANT:
     *
     * Nothing in this route changes:
     * - death verification
     * - memorial publication
     * - is_living_preplan
     * - Backup Person permissions
     * - post-death unlock status
     *
     * The report is only the beginning of the
     * verification process.
     */
    const verificationEmailResult =
      await requestDeathVerificationEmail(
        req,
        memorialId
      );

    return NextResponse.json({
      success: true,
      alreadyReported: false,
      deathReportedAt: now,
      backupRole: activeBackupRole,
      deathVerificationEmailStatus:
        verificationEmailResult.emailStatus,
      warnings: verificationEmailResult.warning
        ? [verificationEmailResult.warning]
        : [],
      message:
        "The death report has been recorded and is awaiting verification.",
    });
  } catch (error) {
    console.error(
      "REPORT DEATH API ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}
