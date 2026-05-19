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

    await transporter.sendMail({
      from: `"MyEMemorial" <help@myememorial.com>`,
      to,
      subject: "Your Free MyEMemorial Memorial Invitation",
      html: `
        <p>Hello${contactName ? ` ${contactName}` : ""},</p>

        <p>
          You have been invited to create a free memorial on
          <strong>MyEMemorial</strong>.
        </p>

        <p>Your promotional code is:</p>

        <p style="font-size: 20px; font-weight: bold; letter-spacing: 1px;">
          ${code}
        </p>

        <p>
          This code provides a free <strong>${cleanPlanLabel}</strong> memorial.
        </p>

        <p><strong>To begin creating the memorial:</strong></p>

        <ol>
          <li>
            Click this link:<br />
            <a href="https://www.myememorial.com/login?redirect=%2Fcreate">
  https://www.myememorial.com/login?redirect=/create
</a>
          </li>
          <li>
  Create your free MyEMemorial account using your email address and a password you choose.
  This account lets you save, edit, and manage the memorial after it is created.
</li>
          <li>
            Complete the memorial information and upload photos/videos.
          </li>
          <li>
            When you reach the payment section, enter your promotional code and click:
            <br />
            <strong>Use Beta Access Code — Skip Payment</strong>
          </li>
        </ol>

        <p>Your memorial will then be created without payment.</p>

        <p>Thank you,<br />MyEMemorial</p>
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