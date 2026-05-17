"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
export default function NavBar() {
  const router = useRouter();
const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

const isPreplan = pathname === "/create";
  useEffect(() => {
  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setIsLoggedIn(!!user);
  }

  checkUser();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setIsLoggedIn(!!session?.user);
  });

  return () => {
    subscription.unsubscribe();
  };
}, []);
  function linkClass(path: string) {
  return `rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ease-in-out ${
    pathname === path
      ? "bg-emerald-700 text-white"
      : "text-stone-700 hover:bg-stone-200 hover:text-stone-900 hover:scale-105"
  }`;
}

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="text-lg font-bold text-stone-900">
          MyEMemorial
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-3 flex-wrap">
          <Link href="/" className={linkClass("/")}>
            Home
          </Link>

          <Link
  href="/create"
  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ease-in-out ${
    pathname === "/create" && !isPreplan
      ? "bg-emerald-700 text-white"
      : "text-stone-700 hover:bg-stone-200 hover:text-stone-900 hover:scale-105"
  }`}
>
  Create E-Memorial
</Link>

          <Link href="/search" className={linkClass("/search")}>
  Search E-Memorials
</Link>
<Link
  href="/create?mode=preplan"
  className={`hidden sm:inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ease-in-out ${
    isPreplan
      ? "bg-emerald-700 text-white"
      : "text-stone-700 hover:bg-stone-200 hover:text-stone-900 hover:scale-105"
  }`}
>
  My Personal E-Memorial
</Link>
<Link href="/contact" className={linkClass("/contact")}>
  Contact Us
</Link>

{isLoggedIn ? (
  <>
    <Link href="/my-memorials" className={linkClass("/my-memorials")}>
      My Memorials
    </Link>

    <button
      onClick={async () => {
        await supabase.auth.signOut();
        router.refresh();
        router.push("/");
      }}
      className="rounded-full px-4 py-2 text-sm font-semibold text-stone-700 transition-all duration-200 ease-in-out hover:bg-stone-200 hover:text-stone-900 hover:scale-105"
    >
      Log Out
    </button>
  </>
) : (
  <Link href="/login" className={linkClass("/login")}>
    Log In
  </Link>
)}
        </nav>
      </div>
    </header>
  );
}