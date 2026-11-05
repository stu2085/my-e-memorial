"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { trackFunnel } from "../../lib/funnel-tracking";
import { NAME_ENTRY_PREFIX } from "../../lib/name-entry";

type PendingName = { firstName: string; lastName: string };

export default function MemorialStartForm({ source }: { source: "home" | "memorials" }) {
  const id = useId();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showDecision, setShowDecision] = useState(false);
  const [pendingName, setPendingName] = useState<PendingName | null>(null);
  const yesButtonRef = useRef<HTMLButtonElement>(null);
  const beginButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showDecision) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    yesButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDecision();
      }
      if (event.key !== "Tab") return;
      const dialog = document.getElementById(`${id}-account-decision`);
      const buttons = dialog?.querySelectorAll<HTMLButtonElement>("button:not([disabled])");
      if (!buttons?.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
    // closeDecision is intentionally defined in component scope for keyboard dismissal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDecision, id]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || showDecision) return;
    setError("");
    const values = new FormData(event.currentTarget);
    const firstName = String(values.get("firstName") || "").trim();
    const lastName = String(values.get("lastName") || "").trim();
    if (!firstName || !lastName) {
      setError("Please enter their first and last name.");
      return;
    }
    setPendingName({ firstName, lastName });
    setShowDecision(true);
    trackFunnel("account_decision_viewed", { entry_page: source, memorial_type: "departed", plan: "free" });
  }

  function closeDecision() {
    if (busy) return;
    trackFunnel("account_creation_declined", { entry_page: source, memorial_type: "departed", plan: "free" });
    setShowDecision(false);
    setPendingName(null);
    requestAnimationFrame(() => beginButtonRef.current?.focus());
  }

  function acceptDecision() {
    if (busy || !pendingName) return;
    setBusy(true);
    setError("");
    try {
      const token = crypto.randomUUID();
      localStorage.setItem(
        NAME_ENTRY_PREFIX + token,
        JSON.stringify({ ...pendingName, createdAt: Date.now() })
      );
      trackFunnel("account_creation_accepted", { entry_page: source, memorial_type: "departed", plan: "free" });
      trackFunnel("memorial_name_submitted", { entry_page: source, memorial_type: "departed", plan: "free" });
      trackFunnel("plan_selected", { memorial_type: "departed", plan: "free" });
      // Keep the existing name handoff and account flow unchanged.
      window.location.assign(`/create?mode=memorial&plan=free&name_entry=${encodeURIComponent(token)}`);
    } catch {
      setBusy(false);
      setShowDecision(false);
      setError("Your browser could not keep the name for the next step. Please allow site storage and try again, or use Free Plan in the pricing section.");
      requestAnimationFrame(() => beginButtonRef.current?.focus());
    }
  }

  return (
    <>
      <form
        onSubmit={submit}
        className="mx-auto mt-6 max-w-2xl rounded-3xl border border-[#d6ded3] bg-[#edf2e9] p-5 text-left sm:p-6"
        aria-label="Begin a MyEMemorial"
      >
        <p data-clarity-unmask="true" className="mb-4 text-center text-lg font-semibold text-stone-900">
          Begin with your loved one’s name
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label data-clarity-unmask="true" htmlFor={`${id}-first`} className="mb-2 block text-base font-semibold text-stone-900">
              Their first name
            </label>
            <input
              data-clarity-mask="true"
              id={`${id}-first`}
              name="firstName"
              required
              maxLength={100}
              autoComplete="off"
              className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900"
            />
          </div>
          <div>
            <label data-clarity-unmask="true" htmlFor={`${id}-last`} className="mb-2 block text-base font-semibold text-stone-900">
              Their last name
            </label>
            <input
              data-clarity-mask="true"
              id={`${id}-last`}
              name="lastName"
              required
              maxLength={100}
              autoComplete="off"
              className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900"
            />
          </div>
        </div>
        {error && <p role="alert" className="mt-3 text-base text-red-800">{error}</p>}
        <button
          ref={beginButtonRef}
          data-clarity-unmask="true"
          type="submit"
          disabled={busy}
          className="mt-5 min-h-12 w-full rounded-full bg-blue-950 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-900 disabled:opacity-60"
        >
          {busy ? "Continuing…" : "Begin Their MyEMemorial"}
        </button>
        <p data-clarity-unmask="true" className="mt-3 text-center text-base leading-6 text-stone-700">
          Start free, sign in or create an account to save your progress. Add their story and memories at your own pace.
        </p>
      </form>

      {showDecision && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#263746]/55 p-3 backdrop-blur-[2px] sm:p-6"
        >
          <div
            id={`${id}-account-decision`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-decision-title`}
            aria-describedby={`${id}-decision-description`}
            className="my-auto w-full max-w-[460px] rounded-[28px] border border-[#e8dfd1] bg-[#fffcf5] p-5 text-[#514b45] shadow-2xl sm:p-7"
          >
            <h2 id={`${id}-decision-title`} className="text-center text-xl font-semibold leading-snug text-[#344f70] sm:text-2xl">
              Would You Like to Save Your Loved One’s Memorial?
            </h2>
            <p id={`${id}-decision-description`} className="mt-4 text-center text-base leading-7">
              Creating a free account allows you to always return to add cherished photographs, videos, and stories whenever you’re ready.
            </p>
            <div className="mt-5 space-y-4 rounded-2xl bg-[#f3f0e8] p-4 text-sm leading-6">
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-0.5 font-bold text-[#64816c]">✓</span>
                <div>
                  <p className="font-semibold text-[#344f70]">No unwanted marketing emails.</p>
                  <p className="text-[#665f58]">We may send occasional reminders and important updates about your memorial.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-0.5 font-bold text-[#64816c]">✓</span>
                <p className="font-semibold text-[#344f70]">Your personal information is never sold to advertisers.</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <button
                ref={yesButtonRef}
                data-clarity-unmask="true"
                type="button"
                disabled={busy}
                onClick={acceptDecision}
                className="min-h-12 w-full rounded-xl bg-[#426b92] px-4 py-3 text-base font-semibold text-white transition hover:bg-[#345778] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#426b92] disabled:opacity-60"
              >
                {busy ? "Continuing…" : "Yes, Create My Free Account"}
              </button>
              <button
                data-clarity-unmask="true"
                type="button"
                disabled={busy}
                onClick={closeDecision}
                className="min-h-12 w-full rounded-xl border border-[#d8d0c6] bg-transparent px-4 py-3 text-base font-medium text-[#514b45] transition hover:bg-[#f3f0e8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#426b92] disabled:opacity-60"
              >
                Not at This Time, Please Take Me Back
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
