import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const backupLoginAttempts = new Map<
  string,
  { count: number; resetAt: number }
>();

function getClientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function hashBackupPassword(password: string) {
  const salt = randomBytes(16).toString("hex");

  const hash = scryptSync(
    String(password || ""),
    salt,
    64
  ).toString("hex");

  return `scrypt$${salt}$${hash}`;
}

function verifyBackupPassword(
  suppliedPassword: string,
  storedPassword: string
) {
  if (!storedPassword) {
    return false;
  }

  /*
   * New secure password format.
   */
  if (storedPassword.startsWith("scrypt$")) {
    const parts = storedPassword.split("$");

    if (parts.length !== 3) {
      return false;
    }

    const salt = parts[1];
    const storedHash = parts[2];

    if (!salt || !storedHash) {
      return false;
    }

    const suppliedHash = scryptSync(
      String(suppliedPassword || ""),
      salt,
      64
    ).toString("hex");

    const suppliedBuffer = Buffer.from(
      suppliedHash,
      "hex"
    );

    const storedBuffer = Buffer.from(
      storedHash,
      "hex"
    );

    if (suppliedBuffer.length !== storedBuffer.length) {
      return false;
    }

    return timingSafeEqual(
      suppliedBuffer,
      storedBuffer
    );
  }

  /*
   * Temporary compatibility for existing memorials
   * whose backup password was stored as plain text.
   */
  return (
    storedPassword ===
    String(suppliedPassword || "")
  );
}

export async function POST(req: Request) {
  try {
    const { memorialId, email, password } =
      await req.json();

    if (!memorialId || !email || !password) {
      return NextResponse.json(
        {
          error:
            "Missing backup login information.",
        },
        { status: 400 }
      );
    }

    const ip = getClientIp(req);
    const attemptKey = `${ip}:${memorialId}`;
    const now = Date.now();

    const existingAttempt =
      backupLoginAttempts.get(attemptKey);

    if (
      existingAttempt &&
      existingAttempt.resetAt > now
    ) {
      if (existingAttempt.count >= 5) {
        return NextResponse.json(
          {
            error:
              "Too many backup login attempts. Please try again later.",
          },
          { status: 429 }
        );
      }

      backupLoginAttempts.set(attemptKey, {
        count: existingAttempt.count + 1,
        resetAt: existingAttempt.resetAt,
      });
    } else {
      backupLoginAttempts.set(attemptKey, {
        count: 1,
        resetAt: now + 15 * 60 * 1000,
      });
    }

    const { data: memorial, error } =
      await supabaseAdmin
        .from("memorials")
        .select(
          "id, backup_email, backup_password, is_living_preplan"
        )
        .eq("id", memorialId)
        .single();

    if (error || !memorial) {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }

    if (!memorial.is_living_preplan) {
      return NextResponse.json(
        {
          error:
            "Backup access is only available for personal pre-planned memorials.",
        },
        { status: 403 }
      );
    }

    const emailMatches =
      String(memorial.backup_email || "")
        .trim()
        .toLowerCase() ===
      String(email || "")
        .trim()
        .toLowerCase();

    const storedPassword = String(
      memorial.backup_password || ""
    );

    const passwordMatches =
      verifyBackupPassword(
        String(password || ""),
        storedPassword
      );

    if (!emailMatches || !passwordMatches) {
      return NextResponse.json(
        {
          error:
            "Backup email or password is incorrect.",
        },
        { status: 403 }
      );
    }

    /*
     * If this was an older plain-text password,
     * immediately replace it with a secure hash.
     */
    if (
      storedPassword &&
      !storedPassword.startsWith("scrypt$")
    ) {
      const hashedPassword =
        hashBackupPassword(
          String(password || "")
        );

      const { error: passwordUpgradeError } =
        await supabaseAdmin
          .from("memorials")
          .update({
            backup_password: hashedPassword,
          })
          .eq("id", memorial.id);

      if (passwordUpgradeError) {
        console.error(
          "BACKUP PASSWORD UPGRADE ERROR:",
          passwordUpgradeError
        );

        return NextResponse.json(
          {
            error:
              "Backup access could not be completed.",
          },
          { status: 500 }
        );
      }
    }

    const backupAccessSecret =
      process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!backupAccessSecret) {
      return NextResponse.json(
        {
          error:
            "Backup access is not configured.",
        },
        { status: 500 }
      );
    }

    const signature = createHmac(
      "sha256",
      backupAccessSecret
    )
      .update(String(memorial.id))
      .digest("hex");

    /*
     * Successful login — clear this server
     * instance's failed-attempt counter.
     */
    backupLoginAttempts.delete(attemptKey);

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set(
      "myememorial_backup_access",
      `${memorial.id}:${signature}`,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60,
      }
    );

    return response;
  } catch (err) {
    console.error(
      "BACKUP LOGIN API ERROR:",
      err
    );

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}