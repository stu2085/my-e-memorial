import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { sessionId } = await req.json();

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === "paid") {
      // ✅ HANDLE RENEWAL
      if (session.metadata?.type === "renewal") {
        const advertiserId = session.metadata.advertiserId;

        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 👉 add 30 days
        const newExpiration = new Date();
        newExpiration.setDate(newExpiration.getDate() + 30);

       const { error } = await supabase
  .from("advertisers")
  .update({
    is_active: true,
    expired_at: null,
    expires_at: newExpiration.toISOString(),
    reminder_7_sent: false,
    reminder_3_sent: false,
    reminder_1_sent: false,
  })
  .eq("id", Number(advertiserId));

if (error) {
  console.error("Renewal update error:", error);
} 
      }

      return NextResponse.json({ paid: true });
    } else {
      return NextResponse.json({ paid: false });
    }
  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return NextResponse.json({ paid: false }, { status: 500 });
  }
}