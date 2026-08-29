"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const DRAFT_STORAGE_KEYS = [
  "memorialDraft",
  "guidedDraftMemorialId",
  "guidedDraftMemorialSlug",
  "guidedDraftCurrentChapter",
  "paidExtraVideos",
  "agreedToTerms",
];

const BACKUP_MEMORIAL_SESSION_KEY = "myememorialBackupMemorialId";

function validMemorialId(value: string | null) {
  const parsed = Number(value || 0);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasBackupAccess, setHasBackupAccess] = useState(false);
  const [isEndingBackupAccess, setIsEndingBackupAccess] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const mode = searchParams.get("mode");

  const isPersonalCreate =
    pathname === "/personal-e-memorials" ||
    (pathname === "/create" &&
      (mode === "personal" || mode === "preplan"));

  const isMemorialCreate =
    pathname === "/memorials" ||
    (pathname === "/create" && !isPersonalCreate);

  const myAccountHref = isLoggedIn
    ? "/my-memorials"
    : "/login?mode=login&redirect=%2Fmy-memorials";

  const isMyAccountPage =
    pathname === "/my-memorials" || pathname === "/login";

  const resolveBackupMemorialId = useCallback(async () => {
    const queryMemorialId =
      validMemorialId(searchParams.get("edit")) ??
      validMemorialId(searchParams.get("draft")) ??
      validMemorialId(searchParams.get("memorialId"));

    if (queryMemorialId) {
      return queryMemorialId;
    }

    const manageMatch = pathname.match(
      /^\/memorial\/([^/]+)\/manage\/?$/
    );

    if (manageMatch?.[1]) {
      try {
        const slug = decodeURIComponent(manageMatch[1]);

        const response = await fetch(
          `/api/backup-memorial?slug=${encodeURIComponent(slug)}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        if (response.ok) {
          const result = await response.json();
          const memorialId = validMemorialId(
            String(result?.memorial?.id ?? "")
          );

          if (memorialId) {
            return memorialId;
          }
        }
      } catch {
        // The management page will display its own memorial-load error.
      }
    }

    if (typeof window !== "undefined") {
      const rememberedBackupMemorialId = validMemorialId(
        sessionStorage.getItem(BACKUP_MEMORIAL_SESSION_KEY)
      );

      if (rememberedBackupMemorialId) {
        return rememberedBackupMemorialId;
      }

      if (pathname === "/create") {
        const guidedDraftMemorialId = validMemorialId(
          localStorage.getItem("guidedDraftMemorialId")
        );

        if (guidedDraftMemorialId) {
          return guidedDraftMemorialId;
        }
      }
    }

    return null;
  }, [pathname, searchParams]);

  const checkBackupAccess = useCallback(async () => {
    try {
      const memorialId = await resolveBackupMemorialId();

      if (!memorialId) {
        setHasBackupAccess(false);
        return;
      }

      const response = await fetch(
        `/api/backup-access?memorialId=${encodeURIComponent(
          String(memorialId)
        )}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        setHasBackupAccess(false);

        if (typeof window !== "undefined") {
          sessionStorage.removeItem(BACKUP_MEMORIAL_SESSION_KEY);
        }

        return;
      }

      const result = await response.json();
      const backupAccessIsValid = result?.valid === true;

      setHasBackupAccess(backupAccessIsValid);

      if (typeof window !== "undefined") {
        if (backupAccessIsValid) {
          sessionStorage.setItem(
            BACKUP_MEMORIAL_SESSION_KEY,
            String(memorialId)
          );
        } else {
          sessionStorage.removeItem(BACKUP_MEMORIAL_SESSION_KEY);
        }
      }
    } catch {
      setHasBackupAccess(false);
    }
  }, [resolveBackupMemorialId]);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (active) {
        setIsLoggedIn(!!session?.user);
      }
    }

    void checkSession();
    void checkBackupAccess();

    const handleBackupAccessChange = () => {
      void checkBackupAccess();
    };

    window.addEventListener(
      "myememorial-backup-access-change",
      handleBackupAccessChange
    );

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setIsLoggedIn(!!session?.user);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener(
        "myememorial-backup-access-change",
        handleBackupAccessChange
      );
    };
  }, [checkBackupAccess]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  function clearCreateDraftStorage() {
    for (const key of DRAFT_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  }

  function openLandingPageAtTop(
    targetPath: "/personal-e-memorials" | "/memorials"
  ) {
    setIsMobileMenuOpen(false);
    clearCreateDraftStorage();

    if (pathname === targetPath) {
      window.history.replaceState(
        window.history.state,
        "",
        targetPath
      );
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
      return;
    }

    router.push(targetPath, { scroll: true });
  }

  function navClass(active: boolean) {
    return `inline-flex items-center justify-center whitespace-nowrap rounded-full px-1.5 py-2 text-base font-semibold transition-all duration-200 ease-in-out ${
      active
        ? "bg-blue-900 text-white"
        : "text-stone-700 hover:scale-105 hover:bg-blue-50 hover:text-blue-900"
    }`;
  }

  function mobileNavClass(active: boolean) {
    return `flex w-full items-center rounded-xl px-4 py-3 text-left text-base font-semibold transition ${
      active
        ? "bg-blue-900 text-white"
        : "text-stone-800 hover:bg-blue-50 hover:text-blue-900"
    }`;
  }

  async function handleEndBackupAccess() {
    if (isEndingBackupAccess) return;

    setIsMobileMenuOpen(false);
    setIsEndingBackupAccess(true);

    try {
      const response = await fetch("/api/backup-access/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        return;
      }

      setHasBackupAccess(false);
      sessionStorage.removeItem(BACKUP_MEMORIAL_SESSION_KEY);

      window.dispatchEvent(
        new Event("myememorial-backup-access-change")
      );
      window.location.assign("/");
    } finally {
      setIsEndingBackupAccess(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-[1600px] px-3 py-2 min-[1380px]:flex min-[1380px]:items-center min-[1380px]:gap-1 min-[1380px]:px-3 xl:px-4 2xl:px-6">
        <div className="flex w-full items-center justify-between gap-3 min-[1380px]:w-auto">
          <a
            href="/"
            className="flex min-w-0 shrink-0 items-center"
            aria-label="MyEMemorial home"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <img
              src="/Images/myememorial-logo-navbar.png"
              alt="MyEMemorial"
              className="h-16 w-auto max-w-[225px] object-contain sm:h-20 sm:max-w-none min-[1380px]:h-[88px] 2xl:h-24"
            />
          </a>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-3 text-base font-semibold text-stone-800 shadow-sm transition hover:bg-stone-100 min-[1380px]:hidden"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-main-navigation"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              {isMobileMenuOpen ? "✕" : "☰"}
            </span>
            {isMobileMenuOpen ? "Close" : "Menu"}
          </button>
        </div>

        <nav
          className="hidden min-w-0 flex-1 flex-nowrap items-center justify-end gap-x-0.5 min-[1380px]:flex xl:gap-x-1 2xl:gap-x-3"
          aria-label="Main navigation"
        >
          <Link href="/" className={navClass(pathname === "/")}>
            Home
          </Link>

          <Link
            href="/personal-e-memorials"
            onClick={(event) => {
              event.preventDefault();
              openLandingPageAtTop("/personal-e-memorials");
            }}
            className={navClass(isPersonalCreate)}
          >
            Create a Living MyEMemorial
          </Link>

          <Link
            href="/memorials"
            onClick={(event) => {
              event.preventDefault();
              openLandingPageAtTop("/memorials");
            }}
            className={navClass(isMemorialCreate)}
          >
            Create a Departed MyEMemorial
          </Link>

          <Link
            href="/search"
            className={navClass(pathname === "/search")}
          >
            Search Public MyEMemorials
          </Link>

          <Link
            href="/contact"
            className={navClass(pathname === "/contact")}
          >
            Contact Us
          </Link>

          <Link
            href={myAccountHref}
            className={navClass(isMyAccountPage)}
          >
            My Account
          </Link>

          {hasBackupAccess ? (
            <button
              type="button"
              onClick={handleEndBackupAccess}
              disabled={isEndingBackupAccess}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full px-1.5 py-2 text-base font-semibold text-red-700 transition-all duration-200 ease-in-out hover:scale-105 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isEndingBackupAccess
                ? "Ending Backup Access..."
                : "End Backup Access"}
            </button>
          ) : isLoggedIn ? (
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                router.refresh();
                router.push("/");
              }}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full px-1.5 py-2 text-base font-semibold text-stone-700 transition-all duration-200 ease-in-out hover:scale-105 hover:bg-stone-200 hover:text-stone-900"
            >
              Log Out
            </button>
          ) : null}
        </nav>

        {isMobileMenuOpen && (
          <nav
            id="mobile-main-navigation"
            className="mt-2 grid gap-1 border-t border-stone-200 pt-2 min-[1380px]:hidden"
            aria-label="Mobile main navigation"
          >
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={mobileNavClass(pathname === "/")}
            >
              Home
            </Link>

            <Link
              href="/personal-e-memorials"
              onClick={(event) => {
                event.preventDefault();
                openLandingPageAtTop("/personal-e-memorials");
              }}
              className={mobileNavClass(isPersonalCreate)}
            >
              Create a Living MyEMemorial
            </Link>

            <Link
              href="/memorials"
              onClick={(event) => {
                event.preventDefault();
                openLandingPageAtTop("/memorials");
              }}
              className={mobileNavClass(isMemorialCreate)}
            >
              Create a Departed MyEMemorial
            </Link>

            <Link
              href="/search"
              onClick={() => setIsMobileMenuOpen(false)}
              className={mobileNavClass(pathname === "/search")}
            >
              Search Public MyEMemorials
            </Link>

            <Link
              href="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className={mobileNavClass(pathname === "/contact")}
            >
              Contact Us
            </Link>

            <Link
              href={myAccountHref}
              onClick={() => setIsMobileMenuOpen(false)}
              className={mobileNavClass(isMyAccountPage)}
            >
              My Account
            </Link>

            {hasBackupAccess ? (
              <button
                type="button"
                onClick={handleEndBackupAccess}
                disabled={isEndingBackupAccess}
                className="flex w-full items-center rounded-xl px-4 py-3 text-left text-base font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isEndingBackupAccess
                  ? "Ending Backup Access..."
                  : "End Backup Access"}
              </button>
            ) : isLoggedIn ? (
              <button
                type="button"
                onClick={async () => {
                  setIsMobileMenuOpen(false);
                  await supabase.auth.signOut();
                  router.refresh();
                  router.push("/");
                }}
                className="flex w-full items-center rounded-xl px-4 py-3 text-left text-base font-semibold text-stone-800 transition hover:bg-stone-100"
              >
                Log Out
              </button>
            ) : null}
          </nav>
        )}
      </div>
    </header>
  );
}
