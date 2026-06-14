import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { transporter } from "../../../lib/email";

const ADMIN_EMAIL = "mike@realchoicerealestate.com";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function planLabel(plan: string) {
  if (plan === "premium") return "Premium";
  if (plan === "plus") return "Plus";
  return "Basic";
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const {
      to,
      contactName,
      code,
      allowedPlan,
    } = await req.json();

    if (!to || !code) {
      return NextResponse.json(
        { error: "Missing email address or promo code." },
        { status: 400 }
      );
    }

    const cleanPlanLabel = planLabel(allowedPlan || "basic");

const inviteLink = `https://www.myememorial.com/login?mode=signup&redirect=${encodeURIComponent(
  `/create?promo=${encodeURIComponent(code)}#payment`
)}`;

    await transporter.sendMail({
      from: `"MyEMemorial" <help@myememorial.com>`,
      to,
      subject: "Your Free MyEMemorial Memorial Invitation",
      html: `
  <div style="font-family: Arial, sans-serif; color: #1c1917; line-height: 1.6;">
    <div style="text-align: center; margin-bottom: 24px;">
      <img
        src="https://www.myememorial.com/myememorial-logo.png"
        alt="MyEMemorial"
        style="max-width: 250px; height: auto;"
      />
    </div>

    <p>Hello${contactName ? ` ${contactName}` : ""},</p>

    <p>
      You have been invited to create a free
      <strong>${cleanPlanLabel}</strong> memorial on
      <strong>MyEMemorial</strong>.
    </p>

    <p>
      Click the button below to begin:
    </p>

    <p style="text-align: center; margin: 28px 0;">
      <a
        href="${inviteLink}"
        style="display: inline-block; background-color: #172554; color: #ffffff; padding: 12px 22px; border-radius: 999px; text-decoration: none; font-weight: bold;"
      >
        Create Your Free Memorial
      </a>
    </p>

    <p style="font-size: 13px; color: #57534e;">
      If the button does not work, copy and paste this link into your browser:<br />
      <a href="${inviteLink}" style="color: #172554;">${inviteLink}</a>
    </p>

    <p>
      After creating your account, you can immediately begin building the memorial
      by adding music, photos, videos, life stories, family history, and other memories.
    </p>

    <p>
      Your complimentary <strong>${cleanPlanLabel}</strong> access is already included
      in the link above, so no payment information or promotional code entry is required.
    </p>

    <p>
      Thank you for helping us improve MyEMemorial through early access testing.
    </p>

    <p>Thank you,<br />MyEMemorial</p>
  </div>
`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Promo invite email error:", error);
    return NextResponse.json(
      { error: "Could not send promo invitation email." },
      { status: 500 }
    );
  }
}