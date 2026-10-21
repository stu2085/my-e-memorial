// Keep test traffic out of the live analytics and advertising properties.
// An exact allowlist also excludes localhost, LAN addresses and preview hosts.
export function isProductionTrackingAllowed(): boolean {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "production") return false;
  return window.location.protocol === "https:" &&
    ["myememorial.com", "www.myememorial.com"].includes(window.location.hostname.toLowerCase());
}
