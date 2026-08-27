"use client";

import { Suspense, useEffect, useRef } from "react";
import Script from "next/script";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
 const mode = searchParams.get("mode") || "access";

const redirectTo =
  searchParams.get("redirect") ||
  (mode === "signup"
    ? "/create"
    : "/my-memorials");
  const prefilledEmail = searchParams.get("email") || "";
  const isSignupMode = mode === "signup";
  const isBackupMode = mode === "backup";
const isAccessChoiceMode = mode === "access";
const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState(prefilledEmail);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [backupMemorials, setBackupMemorials] = useState<
  Array<{
    id: number;
    slug: string;
    fullName: string;
  }>
>([]);
  const turnstileRef = useRef<HTMLDivElement | null>(null);
  const submitLockRef = useRef(false);
  const isChoiceMode = mode === "choice";
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
async function openBackupMemorial(memorial: {
  id: number;
  slug: string;
  fullName: string;
}) {
  setMessage("");
  setIsSubmitting(true);

  try {
    const response = await fetch(
      "/api/backup-login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          memorialId: memorial.id,
          email,
          password,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      setMessage(
        result.error ||
          "Backup Person access could not be completed."
      );
      setIsSubmitting(false);
      return;
    }

    window.location.assign(
      `/memorial/${memorial.slug}/manage`
    );
  } catch (error) {
    console.error(
      "BACKUP PERSON LOGIN ERROR:",
      error
    );

    setMessage(
      "Backup Person access could not be completed."
    );
    setIsSubmitting(false);
  }
}
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    
      if (!email || !password) {
  setMessage("Please enter your email and create a password.");
  setIsSubmitting(false);
  return;
}

if (
  isSignupMode &&
  email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()
) {
  setMessage("Email addresses do not match.");
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

  const turnstile = (window as any).turnstile;

  if (turnstile) {
    turnstile.reset();
  }

  setIsSubmitting(false);
  return;
}
if (isBackupMode) {
  try {
    const response = await fetch(
      "/api/backup-login/find",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      setMessage(
        result.error ||
          "Backup Person email or password is incorrect."
      );

      const turnstile =
        (window as any).turnstile;

      if (turnstile) {
        turnstile.reset();
      }

      setIsSubmitting(false);
      return;
    }

    const memorials = Array.isArray(
      result.memorials
    )
      ? result.memorials
      : [];

    if (memorials.length === 0) {
      setMessage(
        "No Living MyEMemorial was found for those Backup Person credentials."
      );
      setIsSubmitting(false);
      return;
    }

    if (memorials.length === 1) {
      await openBackupMemorial(
        memorials[0]
      );
      return;
    }

    setBackupMemorials(memorials);
    setIsSubmitting(false);
    return;
  } catch (error) {
    console.error(
      "BACKUP PERSON LOOKUP ERROR:",
      error
    );

    setMessage(
      "Backup Person login could not be completed."
    );
    setIsSubmitting(false);
    return;
  }
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
  setIsSubmitting(false);
  return;
}

    window.location.assign(redirectTo);
  }
  if (isAccessChoiceMode) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-4xl font-bold text-stone-900">
          Log In to MyEMemorial
        </h1>

        <p className="mt-3 text-base leading-7 text-stone-600">
          Choose how you would like to access MyEMemorial.
        </p>

        <a
          href={`/login?mode=login&redirect=${encodeURIComponent(
            redirectTo
          )}`}
          className="mt-7 block rounded-2xl border border-stone-300 bg-white p-6 transition hover:bg-stone-50"
        >
          <span className="block text-xl font-bold text-stone-900">
            Memorial Owner Login
          </span>

          <span className="mt-2 block text-base leading-7 text-stone-600">
            Log in to create, edit, and manage memorials that belong to you.
          </span>
        </a>

        <a
          href="/login?mode=backup"
          className="mt-5 block rounded-2xl border border-stone-300 bg-stone-900 p-6 text-white transition hover:bg-stone-700"
        >
          <span className="block text-xl font-bold">
            Backup Person Login
          </span>

          <span className="mt-2 block text-base leading-7 text-stone-200">
            Access a Living MyEMemorial when someone has assigned you as their Backup Person.
          </span>
        </a>
      </div>
    </main>
  );
}
if (isChoiceMode) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-4xl font-bold text-stone-900">
          Continue to MyEMemorial
        </h1>

        <p className="mt-3 text-base text-stone-600">
          Do you already have an account?
        </p>

        <a
          href={`/login?mode=login&redirect=${encodeURIComponent(redirectTo)}`}
          className="mt-6 block w-full rounded-full border border-stone-300 bg-white px-6 py-3 text-center text-base font-semibold text-stone-800 hover:bg-stone-100"
        >
          I Already Have an Account
        </a>

        <a
          href={`/login?mode=signup&email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectTo)}`}
          className="mt-4 block w-full rounded-full bg-stone-900 px-6 py-3 text-center text-base font-semibold text-white hover:bg-stone-700"
        >
          Create New Account
        </a>
      </div>
    </main>
  );
}
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm"
      >
       <h1 className="text-4xl font-bold text-stone-900">
  {isSignupMode
    ? "Create Account"
    : isBackupMode
      ? "Backup Person Login"
      : "Memorial Owner Login"}
</h1>

     

<p className="mt-2 text-base leading-7 text-stone-600">
  {isSignupMode
    ? "Create your account first so your memorial ownership is saved correctly."
    : isBackupMode
      ? "Enter the email address and password assigned to you by the owner of the Living MyEMemorial."
      : "Log in to access and manage your memorials."}
</p>

        <div className="mt-6 space-y-4">
  <label className="block">
    <span className="mb-2 block text-base font-semibold text-stone-700">
      Email Address
    </span>

    <input
      type="email"
      placeholder="Email"
      autoComplete="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      className="w-full rounded-2xl border border-stone-300 px-4 py-3"
      required
    />
  </label>

  {isSignupMode && (
    <label className="block">
      <span className="mb-2 block text-base font-semibold text-stone-700">
        Confirm Email Address
      </span>

      <input
        type="email"
        placeholder="Confirm Email"
        autoComplete="email"
        value={confirmEmail}
        onChange={(e) => setConfirmEmail(e.target.value)}
        className="w-full rounded-2xl border border-stone-300 px-4 py-3"
        required
      />
    </label>
  )}

  <label className="block">
    <span className="mb-2 block text-base font-semibold text-stone-700">
      {isSignupMode ? "Create Password" : "Password"}
    </span>

    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        placeholder={isSignupMode ? "Create Password" : "Password"}
        autoComplete={isSignupMode ? "new-password" : "current-password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-2xl border border-stone-300 px-4 py-3 pr-14"
        required
      />

      <button
        type="button"
        onClick={() => setShowPassword((previous) => !previous)}
        className="absolute inset-y-0 right-0 flex w-14 items-center justify-center rounded-r-2xl text-stone-600 hover:bg-stone-100 hover:text-stone-900"
        aria-label={showPassword ? "Hide password" : "Show password"}
        title={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
            <path d="M9.9 4.2A10.5 10.5 0 0 1 12 4c5.5 0 9.5 4.8 10 8-.2 1.2-.9 2.6-2 3.8" />
            <path d="M6.6 6.6C4 8.2 2.4 10.5 2 12c.5 3.2 4.5 8 10 8 1.2 0 2.3-.2 3.3-.6" />
          </svg>
        ) : (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  </label>

  {isSignupMode && (
    <label className="block">
      <span className="mb-2 block text-base font-semibold text-stone-700">
        Confirm Password
      </span>

      <div className="relative">
        <input
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Confirm Password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 pr-14"
          required
        />

        <button
          type="button"
          onClick={() =>
            setShowConfirmPassword((previous) => !previous)
          }
          className="absolute inset-y-0 right-0 flex w-14 items-center justify-center rounded-r-2xl text-stone-600 hover:bg-stone-100 hover:text-stone-900"
          aria-label={
            showConfirmPassword
              ? "Hide confirmed password"
              : "Show confirmed password"
          }
          title={
            showConfirmPassword
              ? "Hide confirmed password"
              : "Show confirmed password"
          }
        >
          {showConfirmPassword ? (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3l18 18" />
              <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
              <path d="M9.9 4.2A10.5 10.5 0 0 1 12 4c5.5 0 9.5 4.8 10 8-.2 1.2-.9 2.6-2 3.8" />
              <path d="M6.6 6.6C4 8.2 2.4 10.5 2 12c.5 3.2 4.5 8 10 8 1.2 0 2.3-.2 3.3-.6" />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </label>
  )}
</div>
<Script
  src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
  async
  defer
/>

<div ref={turnstileRef} className="mt-4" />
        {message && <p className="mt-4 text-base text-red-600">{message}</p>}
{isBackupMode &&
  backupMemorials.length > 1 && (
    <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-5">
      <p className="text-lg font-bold text-stone-900">
        Choose a Living MyEMemorial
      </p>

      <p className="mt-2 text-base leading-7 text-stone-600">
        Your credentials match more than one Living MyEMemorial.
      </p>

      <div className="mt-4 space-y-3">
        {backupMemorials.map(
          (memorial) => (
            <button
              key={memorial.id}
              type="button"
              onClick={() =>
                openBackupMemorial(
                  memorial
                )
              }
              className="w-full rounded-xl border border-stone-300 bg-white px-5 py-4 text-left text-base font-bold text-stone-900 hover:bg-stone-100"
            >
              {memorial.fullName}
            </button>
          )
        )}
      </div>
    </div>
  )}
        <button
          type="submit"
          disabled={isSubmitting}
         className="mt-6 w-full rounded-full border border-stone-300 bg-white px-6 py-3 text-base font-semibold text-stone-800 hover:bg-stone-100"
        >
         {isSubmitting
  ? isSignupMode
    ? "Creating account..."
    : isBackupMode
      ? "Checking Backup Person Access..."
      : "Logging in..."
  : isSignupMode
    ? "Create Account"
    : isBackupMode
      ? "Continue as Backup Person"
      : "Log In"}
        </button>

        

        {isSignupMode && (
          <a
            href={`/login?mode=login&redirect=${encodeURIComponent(redirectTo)}`}
            className="mt-3 block w-full text-center text-base font-medium text-stone-600 hover:text-stone-900"
          >
            Already have an account? Log in
          </a>
        )}
      </form>
    </main>
  );
}

export default function LoginClient() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}