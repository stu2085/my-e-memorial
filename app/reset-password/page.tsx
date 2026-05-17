"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleResetPassword() {
    setMessage("");

    if (!password || !confirmPassword) {
      setMessage("Please enter and confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Password updated successfully. Redirecting to login...");

    setTimeout(() => {
      router.push("/login");
    }, 1200);
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-12">
      <section className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-stone-900">
          Reset Password
        </h1>

        <p className="mt-3 text-sm text-stone-600">
          Enter your new password below.
        </p>

        {message && (
          <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
            {message}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-stone-300 px-4 py-3"
          />

          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-2xl border border-stone-300 px-4 py-3"
          />

          <button
            type="button"
            onClick={handleResetPassword}
            disabled={saving}
            className="w-full rounded-full bg-emerald-700 px-6 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {saving ? "Updating..." : "Update Password"}
          </button>
        </div>
      </section>
    </main>
  );
}