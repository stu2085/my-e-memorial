"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { isProductionTrackingAllowed } from "../../lib/tracking-environment";
import { funnelContext, trackFunnel } from "../../lib/funnel-tracking";

const PROJECT_ID = "yws1foa6kg";
const PUBLIC_PAGES = new Set([
  "/", "/memorials", "/personal-e-memorials", "/plans-pricing",
  "/celebration-of-life-presentation",
]);
const JOURNEY_PAGES = new Set(["/login", "/create", "/my-memorials"]);
const ATTRIBUTION_PARAMETERS = new Set([
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "msclkid", "gclid", "fbclid",
]);

type ClarityFunction = ((...args: unknown[]) => void) & {
  q?: unknown[][];
  t?: boolean;
  v?: string;
};

declare global {
  interface Window {
    clarity?: ClarityFunction;
    __myemClarityStarted?: boolean;
    __myemClarityStopped?: boolean;
  }
}

// Account/Builder URLs use enumerated values and opaque record references.
// Never allow email addresses, passwords, auth codes, gift/access tokens or
// unvalidated nested redirects into recorded URLs. Text masking alone does
// not mask URLs. Stripe session references are not authentication tokens.
function isApproved(url: URL, depth = 0): boolean {
  if (depth > 3 || url.origin !== window.location.origin) return false;
  const path = url.pathname.replace(/\/$/, "") || "/";
  if (!PUBLIC_PAGES.has(path) && !JOURNEY_PAGES.has(path)) return false;
  if (url.hash && !(PUBLIC_PAGES.has(path) && url.hash === "#pricing")) return false;

  for (const [key, value] of url.searchParams) {
    if (ATTRIBUTION_PARAMETERS.has(key)) continue;
    if (!JOURNEY_PAGES.has(path)) return false;
    if (key === "mode" && ["choice", "login", "signup", "access", "backup",
      "builder-return", "memorial", "deceased", "personal", "preplan"].includes(value)) continue;
    if (key === "plan" && ["free", "basic", "plus", "premium"].includes(value)) continue;
    if (["edit", "draft", "resume", "extra_videos_paid"].includes(key) && /^\d{1,12}$/.test(value)) continue;
    if (["success", "upgrade_success", "autocheckout"].includes(key) && ["true", "false", "1", "0"].includes(value)) continue;
    if (key === "name_entry" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) continue;
    if (key === "session_id" && /^cs_(?:live|test)_[A-Za-z0-9_]+$/.test(value)) continue;
    if (key === "promo" && /^[A-Za-z0-9_-]{1,64}$/.test(value)) continue;
    if (key === "email" && value === "") continue;
    if (key === "redirect" && path === "/login" && value.startsWith("/") &&
        !value.startsWith("//") && !/[\\\r\n]/.test(value)) {
      try {
        if (isApproved(new URL(value, window.location.origin), depth + 1)) continue;
      } catch { /* Invalid destinations remain excluded. */ }
    }
    return false;
  }
  return true;
}

// Mask the whole account/Builder document, including shared headers and
// portals. Explicitly marked static controls can remain readable. The page
// components also provide server-rendered masks before this effect runs.
function applyRouteMask(url: URL): void {
  const path = url.pathname.replace(/\/$/, "") || "/";
  const root = document.documentElement;
  if (JOURNEY_PAGES.has(path)) {
    if (!root.hasAttribute("data-myem-clarity-mask")) {
      root.setAttribute("data-myem-clarity-mask", root.getAttribute("data-clarity-mask") ?? "");
    }
    root.setAttribute("data-clarity-mask", "true");
  } else if (root.hasAttribute("data-myem-clarity-mask")) {
    const previous = root.getAttribute("data-myem-clarity-mask");
    if (previous) root.setAttribute("data-clarity-mask", previous);
    else root.removeAttribute("data-clarity-mask");
    root.removeAttribute("data-myem-clarity-mask");
  }
}

function stopClarity(): void {
  if (!window.__myemClarityStarted || window.__myemClarityStopped) return;
  window.__myemClarityStopped = true;
  const clarity = window.clarity;
  if (clarity) {
    if (!clarity.v) {
      clarity.q = [];
      clarity.t = true;
    }
    clarity("stop");
  }
  document.getElementById("myem-public-clarity")?.remove();
}

function shouldStopForDestination(href: string): boolean {
  try { return !isApproved(new URL(href, window.location.href)); }
  catch { return true; }
}

export default function PublicClarity() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (!isProductionTrackingAllowed()) return;
    const url = new URL(window.location.href);
    applyRouteMask(url);
    if (!isApproved(url)) { stopClarity(); return; }
    if (window.__myemClarityStarted || window.__myemClarityStopped) return;
    if (!window.clarity) {
      const queue: ClarityFunction = (...args: unknown[]) => {
        if (window.__myemClarityStopped) return;
        (queue.q ??= []).push(args);
      };
      queue.q = [];
      window.clarity = queue;
    }
    window.__myemClarityStarted = true;
    const script = document.createElement("script");
    script.id = "myem-public-clarity";
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${PROJECT_ID}`;
    document.head.appendChild(script);
  }, [pathname]);

  useEffect(() => {
    if (!isProductionTrackingAllowed()) return;
    // This host contains the Builder's fixed chapter navigation, not chapter
    // contents. Keep its labels readable while the rest of the document masks
    // user-entered text. It can mount after draft/account loading completes.
    const markChapterNavigation = () => {
      if (window.location.pathname.replace(/\/$/, "") !== "/create") return;
      const navigation = document.getElementById("memorial-builder-chapter-nav");
      if (navigation && navigation.getAttribute("data-clarity-unmask") !== "true") {
        navigation.setAttribute("data-clarity-unmask", "true");
      }
    };
    markChapterNavigation();
    const navigationObserver = new MutationObserver(markChapterNavigation);
    navigationObserver.observe(document.body, { childList: true, subtree: true });
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      const destination = new URL(link.href, window.location.href);
      // Retain the existing GA4 plan-click event.
      if (destination.origin === window.location.origin && destination.pathname === "/create" &&
          ["free", "basic", "plus", "premium"].includes(destination.searchParams.get("plan") || "")) {
        trackFunnel("plan_selected", funnelContext(destination.href));
      }
      if (shouldStopForDestination(link.href)) {
        stopClarity();
        // Keep the old fresh-document boundary for excluded routes. Ordinary
        // account/Builder links now pass through without stopping Clarity.
        if (destination.origin === window.location.origin && !event.ctrlKey &&
            !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0 &&
            (!link.target || link.target === "_self") && !link.hasAttribute("download")) {
          event.preventDefault();
          event.stopImmediatePropagation();
          window.location.assign(destination.href);
        }
      } else if (!event.ctrlKey && !event.metaKey && !event.shiftKey &&
                 !event.altKey && event.button === 0 &&
                 (!link.target || link.target === "_self") && !link.hasAttribute("download")) {
        applyRouteMask(destination);
      }
    };
    const onSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (form instanceof HTMLFormElement && shouldStopForDestination(form.action)) stopClarity();
    };
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    history.pushState = function (data, unused, url) {
      if (url != null) {
        const destination = new URL(String(url), window.location.href);
        if (window.__myemClarityStarted && !isApproved(destination)) {
          stopClarity();
          window.location.assign(destination.href);
          return;
        }
        applyRouteMask(destination);
      }
      return originalPushState.call(this, data, unused, url);
    };
    history.replaceState = function (data, unused, url) {
      if (url != null) {
        const destination = new URL(String(url), window.location.href);
        if (window.__myemClarityStarted && !isApproved(destination)) {
          stopClarity();
          window.location.assign(destination.href);
          return;
        }
        applyRouteMask(destination);
      }
      return originalReplaceState.call(this, data, unused, url);
    };
    const onLocationChange = () => {
      const url = new URL(window.location.href);
      applyRouteMask(url);
      if (!isApproved(url)) stopClarity();
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("popstate", onLocationChange);
    window.addEventListener("hashchange", onLocationChange);
    return () => {
      navigationObserver.disconnect();
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("popstate", onLocationChange);
      window.removeEventListener("hashchange", onLocationChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);
  return null;
}
