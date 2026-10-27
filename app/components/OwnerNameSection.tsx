"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

export type OwnerNameHandle = { save: () => Promise<boolean> };

const OwnerNameSection = forwardRef<OwnerNameHandle>(function OwnerNameSection(_props, ref) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);
  const signedIn = useRef(false);
  const edited = useRef(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error && error.name !== "AuthSessionMissingError") {
        setMessage("Your account name could not be loaded. Please refresh and try again.");
        return;
      }
      if (!data.user) { setLoaded(true); return; }
      signedIn.current = true;
      if (!edited.current) {
        const metadata = data.user.user_metadata;
        setFirstName(typeof metadata.first_name === "string" ? metadata.first_name : "");
        setLastName(typeof metadata.last_name === "string" ? metadata.last_name : "");
      }
      setLoaded(true);
    }).catch(() => {
      if (active) setMessage("Your account name could not be loaded. Please refresh and try again.");
    });
    return () => { active = false; };
  }, []);

  useImperativeHandle(ref, () => ({
    async save() {
      if (!loaded) {
        setMessage("Your account name is still loading or could not be loaded. Please try again.");
        return false;
      }
      if (!signedIn.current) return true; // The builder starts its sign-in flow.
      if (!edited.current) return true;
      const first = firstName.trim();
      const last = lastName.trim();
      if (!first && !last) {
        setMessage("Please enter both your first and last name, or leave the saved name unchanged.");
        return false;
      }
      if (!first || !last) {
        setMessage("Please enter both your first and last name.");
        return false;
      }
      try {
        const { error } = await supabase.auth.updateUser({ data: { first_name: first, last_name: last } });
        if (error) throw error;
        edited.current = false;
        setMessage("");
        return true;
      } catch {
        setMessage("Your name could not be saved. Please try again.");
        return false;
      }
    },
  }), [firstName, lastName, loaded]);

  return <section className="mb-8 rounded-2xl border border-stone-200 bg-white p-5">
    <h3 className="text-xl font-semibold text-stone-900">Who is creating this memorial?</h3>
    <p className="mt-2 text-base text-stone-700">We use your name to personalize messages about your account and memorials.</p>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <label className="text-base font-medium text-stone-800">Your first name<input className="mt-1 block w-full rounded-lg border border-stone-400 px-3 py-2 text-base" value={firstName} maxLength={100} onChange={e => { edited.current = true; setFirstName(e.target.value); }} autoComplete="given-name" /></label>
      <label className="text-base font-medium text-stone-800">Your last name<input className="mt-1 block w-full rounded-lg border border-stone-400 px-3 py-2 text-base" value={lastName} maxLength={100} onChange={e => { edited.current = true; setLastName(e.target.value); }} autoComplete="family-name" /></label>
    </div>
    {message && <p role="alert" className="mt-3 text-base text-stone-700">{message}</p>}
  </section>;
});

export default OwnerNameSection;
