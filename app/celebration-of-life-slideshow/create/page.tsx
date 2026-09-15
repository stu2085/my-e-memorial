"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function CelebrationPresentationStartPage() {
  const router = useRouter();

  const [personName, setPersonName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = personName.trim();
    const trimmedEmail = customerEmail.trim();

    if (!trimmedName) {
      setErrorMessage("Please enter their name.");
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage("Please enter your email.");
      return;
    }

    try {
      setIsStarting(true);
      setErrorMessage("");

      const response = await fetch("/api/celebration-presentations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          personName: trimmedName,
          customerEmail: trimmedEmail,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.editUrl) {
        throw new Error(
          result?.error ||
            "Your presentation could not be started."
        );
      }

      router.push(result.editUrl);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Your presentation could not be started."
      );
      setIsStarting(false);
    }
  }

  return (
    <main
      className="min-h-screen px-4 py-10 sm:py-14"
      style={{
        backgroundImage:
          "linear-gradient(rgba(250,247,238,0.28), rgba(250,247,238,0.38)), url('/Images/celebration-builder-background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center top",
      }}
    >
      <div className="mx-auto w-full max-w-2xl rounded-[2rem] border border-[#d9cbb0] bg-[#fffcf5]/95 px-5 py-8 shadow-xl shadow-[#38483d]/15 backdrop-blur-sm sm:px-10 sm:py-10">
        <div className="text-center">
          <p className="text-base font-bold uppercase tracking-[0.14em] text-[#244f40]">
            Celebration of Life Presentation
          </p>
          <div className="mx-auto mt-4 flex max-w-40 items-center gap-3 text-[#b99a68]" aria-hidden="true">
            <span className="h-px flex-1 bg-current" />
            <span>♥</span>
            <span className="h-px flex-1 bg-current" />
          </div>

          <h1 className="mt-4 font-serif text-3xl font-bold text-[#173a31] sm:text-4xl">
            Who are we celebrating?
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-[#344f43]">Gather their photos, videos, and music into a presentation that honors the life they lived.</p>
          <p className="mx-auto mt-3 max-w-lg text-base text-[#344f43]">Create and preview first. A one-time $19.95 purchase lets you share it for 60 days and includes a single-use $19.95 credit toward a new Basic, Plus, or Premium MyEMemorial.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-3xl border border-[#e3d9c5] bg-white/90 p-6 shadow-sm sm:p-8"
        >
          <div>
            <label
              htmlFor="personName"
              className="block text-base font-bold text-[#173a31]"
            >
              Their Name
            </label>

            <input
              id="personName"
              name="personName"
              type="text"
              autoComplete="name"
              value={personName}
              onChange={(event) => setPersonName(event.target.value)}
              placeholder="Full name"
              className="mt-2 w-full rounded-2xl border border-[#cfc9bd] bg-white px-4 py-4 text-base text-stone-900 outline-none transition focus:border-[#244f40] focus:ring-2 focus:ring-[#dfe8e2]"
              disabled={isStarting}
              required
            />
          </div>

          <div className="mt-6">
            <label
              htmlFor="customerEmail"
              className="block text-base font-bold text-[#173a31]"
            >
              Your Email
            </label>

            <input
              id="customerEmail"
              name="customerEmail"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={customerEmail}
              onChange={(event) => setCustomerEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-2xl border border-[#cfc9bd] bg-white px-4 py-4 text-base text-stone-900 outline-none transition focus:border-[#244f40] focus:ring-2 focus:ring-[#dfe8e2]"
              disabled={isStarting}
              required
            />
          </div>

          {errorMessage && (
            <p
              className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-base font-semibold text-red-700"
              role="alert"
            >
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isStarting}
            className="mt-7 inline-flex min-h-14 w-full items-center justify-center rounded-full bg-[#244f40] px-6 py-4 text-lg font-bold text-white transition hover:bg-[#193b30] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isStarting ? "Starting..." : "Continue"}
          </button>
        </form>
      </div>
    </main>
  );
}
