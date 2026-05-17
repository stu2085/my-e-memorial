import { NextResponse } from "next/server";
import { transporter } from "../../lib/email";
const contactAttempts = new Map<
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
export async function POST(req: Request) {
  try {
    const { name, email, message, token } = await req.json();

const ip = getClientIp(req);
const now = Date.now();
const existingAttempt = contactAttempts.get(ip);

if (existingAttempt && existingAttempt.resetAt > now) {
  if (existingAttempt.count >= 5) {
    return NextResponse.json(
      { error: "Too many messages sent. Please try again later." },
      { status: 429 }
    );
  }

  contactAttempts.set(ip, {
    count: existingAttempt.count + 1,
    resetAt: existingAttempt.resetAt,
  });
} else {
  contactAttempts.set(ip, {
    count: 1,
    resetAt: now + 15 * 60 * 1000,
  });
}



if (!token) {
  return NextResponse.json(
    { error: "Captcha verification missing" },
    { status: 400 }
  );
}
const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({
    secret: process.env.TURNSTILE_SECRET_KEY || "",
    response: token,
  }),
});

const verifyData = await verifyRes.json();

if (!verifyData.success) {
  return NextResponse.json(
    { error: "Captcha verification failed" },
    { status: 400 }
  );
}

    await transporter.sendMail({
  from: `"MyEMemorial" <help@myememorial.com>`,
  to: "mike@jmspropertiesonline.com",   // guaranteed delivery
  cc: "help@myememorial.com",           // still test shared mailbox
  replyTo: email,
  subject: `New message from ${name}`,
  text: `
Name: ${name}
Email: ${email}

Message:
${message}
  `,
});
await transporter.sendMail({
  from: `"MyEMemorial" <help@myememorial.com>`,
  to: email,
  subject: "We received your message",
  text: `Hi ${name},

Thanks for contacting MyEMemorial. We received your message and will respond shortly.

— MyEMemorial`,
});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: "Email failed" },
      { status: 500 }
    );
  }
}