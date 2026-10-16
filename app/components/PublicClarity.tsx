"use client";

import { funnelContext, trackFunnel } from "../../lib/funnel-tracking";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const PROJECT_ID = "yws1foa6kg";

// Explicitly allow only marketing pages. Do not include builders, memorials,
// account pages, private editing pages, or checkout return pages.
const PUBLIC_PAGES = new Set([
  "/",
  "/memorials",
  "/personal-e-memorials",
  "/plans-pricing",
  "/celebration-of-life-presentation",
]);

// Only known marketing attribution parameters are allowed on recorded pages.
const ALLOWED_PARAMETERS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "msclkid",
  "gclid",
  "fbclid",
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

function isApproved(url: URL): boolean {
  const path = url.pathname.replace(/\/$/, "") || "/";
  return (
    url.origin === window.location.origin &&
    PUBLIC_PAGES.has(path) &&
    [...url.searchParams.keys()].every((key) => ALLOWED_PARAMETERS.has(key)) &&
    !url.hash // Don't record URLs containing fragments (which can carry tokens).
  );
}

function stopClarity(): void {
  if (!window.__myemClarityStarted || window.__myemClarityStopped) return;
  window.__myemClarityStopped = true;
  const clarity = window.clarity;
  if (clarity) {
    if (!clarity.v) {
      // Prevent a delayed tag response from starting a recording.
      clarity.q = [];
      clarity.t = true;
    }
    clarity("stop");
  }
  document.getElementById("myem-public-clarity")?.remove();
}

function shouldStopForDestination(href: string): boolean {
  try {
    return !isApproved(new URL(href, window.location.href));
  } catch {
    return true;
  }
}

export default function PublicClarity() {
  const pathname = usePathname();

  useEffect(() => {
    // Stop tracking on client-side route changes even if navigation was not
    // initiated by a clicked link. Once stopped, never restart in this tab.
    if (!isApproved(new URL(window.location.href))) {
      stopClarity();
      return;
    }
    if (window.__myemClarityStarted || window.__myemClarityStopped) return;

    // Do not start tracking when a marketing page already contains links with
    // access tokens or private destinations in their URLs. Clarity may capture
    // clicked URLs independently of text masking. Public links to the ordinary
    // plan Builder are allowed; private URLs should never be embedded here.
    const hasSensitiveLink = [...document.querySelectorAll<HTMLAnchorElement>("a[href]")]
      .some((link) => {
        try {
          const url = new URL(link.href, window.location.href);
          const sensitiveKeys = [
            "token", "access_token", "session_id", "code",
            "edit", "draft", "publicid", "public_id", "key", "secret",
          ];
          return [...url.searchParams.keys()].some((key) =>
            sensitiveKeys.includes(key.toLowerCase()),
          );
        } catch {
          return true;
        }
      });
    if (hasSensitiveLink) return;

    // Create the official-style command queue before loading the tag.
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
    // Capture the click before normal Next.js link handlers. We also watch
    // browser History APIs below for programmatic client-side navigation.
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a[href]") as HTMLAnchorElement | null;
      if (link) {
        const destination = new URL(link.href, window.location.href);
        if (destination.origin === window.location.origin && destination.pathname === "/create" &&
            ["free", "basic", "plus", "premium"].includes(destination.searchParams.get("plan") || "")) {
          trackFunnel("plan_selected", funnelContext(destination.href));
        }
      }
      if (link && shouldStopForDestination(link.href)) {
        stopClarity();
        // Use a fresh document for private pages: the Clarity runtime cannot
        // survive into the Builder while its scripts are still loading.
        const url = new URL(link.href, window.location.href);
        if (url.origin === window.location.origin && !event.ctrlKey &&
            !event.metaKey && !event.shiftKey && !event.altKey &&
            event.button === 0 && (!link.target || link.target === "_self") &&
            !link.hasAttribute("download")) {
          event.preventDefault();
          event.stopImmediatePropagation();
          window.location.assign(url.href);
        }
      }
    };

    const onSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (shouldStopForDestination(form.action)) stopClarity();
    };

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    history.pushState = function (data, unused, url) {
      if (url != null && window.__myemClarityStarted &&
          shouldStopForDestination(String(url))) {
        stopClarity();
        window.location.assign(new URL(String(url), window.location.href).href);
        return;
      }
      return originalPushState.call(this, data, unused, url);
    };
    history.replaceState = function (data, unused, url) {
      if (url != null && window.__myemClarityStarted &&
          shouldStopForDestination(String(url))) {
        stopClarity();
        window.location.assign(new URL(String(url), window.location.href).href);
        return;
      }
      return originalReplaceState.call(this, data, unused, url);
    };

    const onLocationChange = () => {
      if (!isApproved(new URL(window.location.href))) stopClarity();
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("popstate", onLocationChange);
    window.addEventListener("hashchange", onLocationChange);

    return () => {
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
