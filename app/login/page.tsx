"use client";
import { Suspense } from "react";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";

function LoginContent() {
    const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/create";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

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
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm"
      >
        <h1 className="text-3xl font-bold text-stone-900">Log In</h1>

        <p className="mt-2 text-sm text-stone-600">
          Log in before creating a memorial so ownership is saved correctly.
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
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-stone-300 px-4 py-3"
            required
          />
        </div>

        {message && (
          <p className="mt-4 text-sm text-red-600">{message}</p>
        )}

        <button
          type="submit"
          className="mt-6 w-full rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white hover:bg-stone-700"
        >
          Log In
        </button>
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
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
}/reset-password`,
      }
    );

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      "Password reset email sent. Please check your email."
    );
  }}
  className="mt-3 w-full text-sm font-medium text-stone-600 hover:text-stone-900"
>
  Forgot Password?
</button>
        <button
  type="button"
  onClick={async () => {
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Account created. Please check your email and click the confirmation link before logging in.");
  }}
  className="mt-3 w-full rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-100"
>
  Create Account
</button>
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