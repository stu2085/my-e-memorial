"use client";

import { useId, useState, type FormEvent } from 'react';
import { trackFunnel } from '../../lib/funnel-tracking';
import { NAME_ENTRY_PREFIX } from '../../lib/name-entry';

export default function MemorialStartForm({ source }: { source: 'home' | 'memorials' }) {
  const id = useId();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError('');
    const values = new FormData(event.currentTarget);
    const firstName = String(values.get('firstName') || '').trim();
    const lastName = String(values.get('lastName') || '').trim();
    if (!firstName || !lastName) { setError('Please enter their first and last name.'); return; }
    try {
      const token = crypto.randomUUID();
      localStorage.setItem(NAME_ENTRY_PREFIX + token, JSON.stringify({ firstName, lastName, createdAt: Date.now() }));
      setBusy(true);
      trackFunnel('memorial_name_submitted', { entry_page: source, memorial_type: 'departed', plan: 'free' });
      trackFunnel('plan_selected', { memorial_type: 'departed', plan: 'free' });
      // A fresh document keeps public-page recording out of account/builder pages.
      window.location.assign(`/create?mode=memorial&plan=free&name_entry=${encodeURIComponent(token)}`);
    } catch {
      setBusy(false);
      setError('Your browser could not keep the name for the next step. Please allow site storage and try again, or use Free Plan in the pricing section.');
    }
  }
  return (
    <form onSubmit={submit} data-clarity-mask="true" className="mx-auto mt-6 max-w-2xl rounded-3xl border border-[#d6ded3] bg-[#edf2e9] p-5 text-left sm:p-6" aria-label="Begin a MyEMemorial">
      <p className="mb-4 text-center text-lg font-semibold text-stone-900">Begin with your loved one’s name</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-first`} className="mb-2 block text-base font-semibold text-stone-900">Their first name</label>
          <input id={`${id}-first`} name="firstName" required maxLength={100} autoComplete="off" className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900" />
        </div>
        <div>
          <label htmlFor={`${id}-last`} className="mb-2 block text-base font-semibold text-stone-900">Their last name</label>
          <input id={`${id}-last`} name="lastName" required maxLength={100} autoComplete="off" className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900" />
        </div>
      </div>
      {error && <p role="alert" className="mt-3 text-base text-red-800">{error}</p>}
      <button type="submit" disabled={busy} className="mt-5 min-h-12 w-full rounded-full bg-blue-950 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-900 disabled:opacity-60">{busy ? 'Continuing…' : 'Begin Their MyEMemorial'}</button>
      <p className="mt-3 text-center text-base leading-6 text-stone-700">Start free, sign in or create an account to save your progress. Add their story and memories at your own pace.</p>
    </form>
  );
}
