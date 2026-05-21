"use client";

import { Suspense, useEffect } from "react";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectTo = searchParams.get("redirect") || "/create";
  const mode = searchParams.get("mode") || "login";
  const isSignupMode = mode === "signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!email || !password) {
      setMessage("Please enter your email and create a password.");
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
        <h1 className="text-3xl font-bold text-stone-900">
          {isSignupMode ? "Create Account" : "Log In"}
        </h1>

        <p className="mt-2 text-sm text-stone-600">
          {isSignupMode
            ? "Create your account first so your memorial ownership is saved correctly."
            : "Log in before creating a memorial so ownership is saved correctly."}
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

          <input
            type="password"
            placeholder={isSignupMode ? "Create Password" : "Password"}
            autoComplete={isSignupMode ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-stone-300 px-4 py-3"
            required
          />
        </div>

        {message && <p className="mt-4 text-sm text-red-600">{message}</p>}

        <button
          type="submit"
          className="mt-6 w-full rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white hover:bg-stone-700"
        >
          {isSignupMode ? "Create Account" : "Log In"}
        </button>

        {!isSignupMode && (
          <>
            <button
              type="button"
              onClick={async () => {
                if (!email) {
                  setMessage("Please enter your email first.");
                  return;
                }

                const { error } = await supabase.auth.resetPasswordForEmail(
                  email,
                  {
                    redirectTo: `${
                      process.env.NEXT_PUBLIC_SITE_URL ||
                      "http://localhost:3000"
                    }/reset-password`,
                  }
                );

                if (error) {
                  setMessage(error.message);
                  return;
                }

                setMessage("Password reset email sent. Please check your email.");
              }}
              className="mt-3 w-full text-sm font-medium text-stone-600 hover:text-stone-900"
            >
              Forgot Password?
            </button>

            <a
              href={`/login?mode=signup&redirect=${encodeURIComponent(
                redirectTo
              )}`}
              className="mt-3 block w-full rounded-full border border-stone-300 px-6 py-3 text-center text-sm font-semibold text-stone-700 hover:bg-stone-100"
            >
              Create Account
            </a>
          </>
        )}

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