import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

async function recipientAccountExists(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw error;
    }

    const accountExists = data.users.some(
      (user) => user.email?.trim().toLowerCase() === normalizedEmail
    );

    if (accountExists) {
      return true;
    }

    if (data.users.length < perPage) {
      return false;
    }

    page += 1;
  }
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json(
        { error: "Missing gift claim token." },
        { status: 400 }
      );
    }

    const { data: gift, error: giftError } = await supabaseAdmin
      .from("memorial_gifts")
      .select(`
        recipient_email,
        status,
        expires_at
      `)
      .eq("claim_token", token)
      .single();

    if (giftError || !gift) {
      return NextResponse.json(
        { error: "This gift invitation could not be found." },
        { status: 404 }
      );
    }

    if (
      gift.status !== "purchased" &&
      gift.status !== "claimed"
    ) {
      return NextResponse.json(
        { error: "This gift is not ready to be claimed." },
        { status: 400 }
      );
    }

    if (
      gift.expires_at &&
      new Date(gift.expires_at).getTime() < Date.now()
    ) {
      return NextResponse.json(
        { error: "This gift invitation has expired." },
        { status: 410 }
      );
    }

    const accountExists = await recipientAccountExists(
      gift.recipient_email
    );

    return NextResponse.json({
      accountExists,
    });
  } catch (error) {
    console.error("GIFT ACCOUNT STATUS ERROR:", error);

    return NextResponse.json(
      { error: "Could not check the recipient account." },
      { status: 500 }
    );
  }
}
