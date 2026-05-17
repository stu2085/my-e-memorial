import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { transporter } from "../../lib/email";

type Advertiser = {
  id: number;
  business_name: string | null;
  email: string | null;
  expires_at: string | null;
  reminder_7_sent: boolean | null;
  reminder_3_sent: boolean | null;
  reminder_1_sent: boolean | null;
  active: boolean | null;
  expired_at: string | null;
  edit_token: string | null;
};

function daysUntil(dateString: string) {
  const today = new Date();
  const expiration = new Date(dateString);

  const todayUtc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const expirationUtc = Date.UTC(
    expiration.getUTCFullYear(),
    expiration.getUTCMonth(),
    expiration.getUTCDate()
  );

  return Math.round((expirationUtc - todayUtc) / (1000 * 60 * 60 * 24));
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: "Missing Supabase environment variables" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: advertisers, error } = await supabase
    .from("advertisers")
    .select(
  
  "id, business_name, email, expires_at, reminder_7_sent, reminder_3_sent, reminder_1_sent, active, expired_at, edit_token"
)
.not("email", "is", null)
    .not("expires_at", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const sent: string[] = [];

  for (const advertiser of advertisers as Advertiser[]) {
    // 🔴 AUTO-EXPIRE ADS
if (advertiser.expires_at) {
  const now = new Date();
  const expiration = new Date(advertiser.expires_at);

  if (expiration < now && advertiser.active) {
  await supabase
    .from("advertisers")
    .update({
      active: false,
      expired_at: new Date().toISOString(),
    })
      .eq("id", advertiser.id);

    
    continue;
  }
}
    if (!advertiser.email || !advertiser.expires_at) continue;

    const daysLeft = daysUntil(advertiser.expires_at);
    

    let reminderField:
      | "reminder_7_sent"
      | "reminder_3_sent"
      | "reminder_1_sent"
      | null = null;

    if (daysLeft === 7 && !advertiser.reminder_7_sent) {
      reminderField = "reminder_7_sent";
    }

    if (daysLeft === 3 && !advertiser.reminder_3_sent) {
      reminderField = "reminder_3_sent";
    }

    if (daysLeft === 1 && !advertiser.reminder_1_sent) {
      reminderField = "reminder_1_sent";
    }

    if (!reminderField) continue;
const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

const renewLink = `${baseUrl}/renew/${advertiser.id}`;
const editLink = `${baseUrl}/advertiser/${advertiser.id}/edit?token=${advertiser.edit_token}`;
    await transporter.sendMail({
      from: `"MyEMemorial" <help@myememorial.com>`,
      to: advertiser.email,
      subject: `Your MyEMemorial advertising expires in ${daysLeft} day${
        daysLeft === 1 ? "" : "s"
      }`,
      text: `Hello,

Your MyEMemorial advertising for ${
        advertiser.business_name || "your business"
      } expires on ${advertiser.expires_at}.

Renew here:
${renewLink}

Please renew before that date to keep your advertising active and keep your zip/category exclusivity.

Thank you,
MyEMemorial`,

html: `
  <p>Hello,</p>

  <p>
    Your MyEMemorial advertising for <strong>${
      advertiser.business_name || "your business"
    }</strong> expires on ${advertiser.expires_at}.
  </p>

  <p>
    Please renew before that date to keep your advertising active and keep your zip/category exclusivity.
  </p>

  <p>
    <a href="${renewLink}"
      style="display:inline-block;padding:12px 20px;background:#000;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
      Renew Now
    </a>
  </p>

  <p style="margin-top:15px;">
  Need to update your ad or fix information?
  <br />
  <a href="${editLink}">Edit your advertisement here</a>
</p>

  <p>Thank you,<br />MyEMemorial</p>
`,
    });

    await supabase
      .from("advertisers")
      .update({ [reminderField]: true })
      .eq("id", advertiser.id);

    sent.push(`${advertiser.business_name || advertiser.id}: ${daysLeft} day reminder`);
  }

  return NextResponse.json({
    success: true,
    remindersSent: sent,
  });
}