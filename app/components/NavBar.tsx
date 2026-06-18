"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
export default function NavBar() {
  const router = useRouter();
const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();
const searchParams = useSearchParams();

const mode = searchParams.get("mode");

const isCreate =
  pathname === "/create" &&
  mode !== "personal" &&
  mode !== "preplan";

const isPreplan =
  pathname === "/create" &&
  (mode === "personal" || mode === "preplan");


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
  return `rounded-full px-2 py-1 text-xs font-semibold transition-all duration-200 ease-in-out sm:px-4 sm:py-2 sm:text-sm ${
    pathname === path
  ? "bg-blue-900 text-white"
  : "text-stone-700 hover:bg-blue-50 hover:text-blue-900 hover:scale-105"
  }`;
}

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-1 px-3 py-1 sm:flex-row sm:justify-between sm:px-6 sm:py-2">
      {/* Logo */}
<a href="/" className="flex shrink-0 items-center">
  <img
    src="/myememorial-logo.png"
    alt="MyEMemorial"
   className="h-24 w-auto max-w-none object-contain sm:h-40"
  />
</a>

        {/* Navigation */}
        <nav className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:gap-3">
          <a href="/" className={linkClass("/")}>
  Home
</a>

          <Link
  href="/create"
  onClick={() => {
    window.location.href = "/create";
  }}
  className={`rounded-full px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold transition-all duration-200 ease-in-out ${
    isCreate
  ? "bg-blue-900 text-white"
  : "text-stone-700 hover:bg-blue-50 hover:text-blue-900 hover:scale-105"
  }`}
>
  Create E-Memorial
</Link>

          <Link href="/search" className={linkClass("/search")}>
  Search E-Memorials
</Link>
<Link
  href="/create?mode=personal"
  onClick={() => {
    window.location.href = "/create?mode=personal";
  }}
  className={`hidden sm:inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ease-in-out ${
    isPreplan
  ? "bg-blue-900 text-white"
  : "text-stone-700 hover:bg-blue-50 hover:text-blue-900 hover:scale-105"
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
      className="rounded-full px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold text-stone-700 transition-all duration-200 ease-in-out hover:bg-stone-200 hover:text-stone-900 hover:scale-105"
    >
      Log Out
    </button>
  </>
) : (
  <Link href="/login?mode=login" className={linkClass("/login")}>
  Log In
</Link>
)}
        </nav>
      </div>
    </header>
  );
}