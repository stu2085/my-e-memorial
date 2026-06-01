"use client";

import { Suspense, useEffect, useRef } from "react";
import Script from "next/script";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectTo = searchParams.get("redirect") || "/create";
  const mode = searchParams.get("mode") || "login";
  const isSignupMode = mode === "signup";
const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const turnstileRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && isSignupMode) {
      router.push(redirectTo);
    }
  }

  checkUser();
}, [router, redirectTo, isSignupMode]);
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
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    if (!email || !password) {
      if (isSignupMode && email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
  setMessage("Email addresses do not match.");
  setIsSubmitting(false);
  return;
}
      setMessage("Please enter your email and create a password.");
      setIsSubmitting(false);
      return;
    }
    const captchaToken = (
  document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement
)?.value;

if (!captchaToken) {
  setMessage("Please complete the captcha verification.");
  setIsSubmitting(false);
  return;
}

const captchaRes = await fetch("/api/verify-captcha", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ token: captchaToken }),
});

if (!captchaRes.ok) {
  setMessage("Captcha verification failed. Please try again.");
  setIsSubmitting(false);
  return;
}
if (isSignupMode && password !== confirmPassword) {
  setMessage("Passwords do not match.");
  setIsSubmitting(false);
  setIsSubmitting(false);
  return;
}
    if (isSignupMode) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${
            process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
          }${redirectTo}`,
        },
      });

      if (error) {
        setMessage(error.message);
        setIsSubmitting(false);
        return;
      }

      setMessage("Account created. Taking you to the memorial form...");

window.location.assign(redirectTo);
return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    window.location.assign(redirectTo);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm"
      >
       <h1 className="text-4xl font-bold text-stone-900">
  {isSignupMode ? "Create Account" : "Log In"}
</h1>

     

<p className="mt-2 text-sm text-stone-600">
  {isSignupMode
    ? "Create your account first so your memorial ownership is saved correctly."
    : "Log in to access and manage your memorials."}
</p>

        <div className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-stone-300 px-4 py-3"
            required
          />
{isSignupMode && (
  <input
    type="email"
    placeholder="Confirm Email"
    autoComplete="email"
    value={confirmEmail}
    onChange={(e) => setConfirmEmail(e.target.value)}
    className="w-full rounded-2xl border border-stone-300 px-4 py-3"
    required
  />
)}
          <input
  type="password"
  placeholder={isSignupMode ? "Create Password" : "Password"}
  autoComplete={isSignupMode ? "new-password" : "current-password"}
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  className="w-full rounded-2xl border border-stone-300 px-4 py-3"
  required
/>

{isSignupMode && (
  <input
    type="password"
    placeholder="Confirm Password"
    autoComplete="new-password"
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
    className="w-full rounded-2xl border border-stone-300 px-4 py-3"
    required
  />
)}

</div>
<Script
  src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
  async
  defer
/>

<div ref={turnstileRef} className="mt-4" />
        {message && <p className="mt-4 text-sm text-red-600">{message}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
         className="mt-6 w-full rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-100"
        >
         {isSubmitting
  ? isSignupMode
    ? "Creating account..."
    : "Logging in..."
  : isSignupMode
    ? "Create Account"
    : "Log In"}
        </button>

        

        {isSignupMode && (
          <a
            href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
            className="mt-3 block w-full text-center text-sm font-medium text-stone-600 hover:text-stone-900"
          >
            Already have an account? Log in
          </a>
        )}
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}