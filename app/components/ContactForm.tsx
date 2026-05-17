"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [status, setStatus] = useState("");
  const [isSending, setIsSending] = useState(false);
const turnstileRef = useRef<HTMLDivElement | null>(null);
useEffect(() => {
  const renderTurnstile = () => {
    const turnstile = (window as any).turnstile;

    if (
      turnstile &&
      turnstileRef.current &&
      turnstileRef.current.childElementCount === 0
    ) {
      turnstile.render(turnstileRef.current, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      });
    }
  };

  renderTurnstile();

  const timer = setTimeout(renderTurnstile, 500);

  return () => clearTimeout(timer);
}, []);
  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (isSending) return;
setIsSending(true);
    setStatus("Sending...");

    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
  ...form,
  token: (document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement)?.value,
}),
    });

    if (res.ok) {
  setStatus("Message sent! We’ll get back to you soon.");
} else {
  setStatus("Something went wrong. Please try again.");
}
    setIsSending(false);
  };

  return (
    <div className="mt-10 mx-auto max-w-3xl rounded-[2rem] bg-white p-8 shadow-sm">
      <h2>Contact Us</h2>
{status.includes("sent") ? (
  <div className="mt-4 rounded-md bg-green-50 p-4 text-green-700">
    Message sent! We’ll get back to you soon.
  </div>
) : (
      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Your Name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full rounded-md border border-stone-300 p-2 mb-3"
        />

        <input
          name="email"
          type="email"
          placeholder="Your Email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full rounded-md border border-stone-300 p-2 mb-3"
        />

        <textarea
          name="message"
          placeholder="Your Message"
          value={form.message}
          onChange={handleChange}
          required
          className="w-full rounded-md border border-stone-300 p-2 mb-3"
        />
<Script
  src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
  async
  defer
/>

<div ref={turnstileRef} className="mb-4" />
        <button
  type="submit"
  disabled={isSending}
  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-stone-900 transition hover:bg-stone-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
>
  {isSending ? "Sending..." : "Send"}
</button>
      </form>)}

      {status && (
  <p
    className={`mt-4 text-sm ${
      status.includes("sent")
        ? "text-green-600"
        : "text-red-600"
    }`}
  >
    {status}
  </p>
)}
    </div>
  );
}