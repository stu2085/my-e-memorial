// Only enumerated plan/mode values are sent. Never send redirect URLs or form contents.
export function funnelContext(path: string) {
  const params = new URL(path, "https://www.myememorial.com").searchParams;
  const candidate = params.get("plan") || "";
  return {
    plan: ["free", "basic", "plus", "premium"].includes(candidate) ? candidate : "unspecified",
    memorial_type: ["personal", "preplan"].includes(params.get("mode") || "") ? "living" : "departed",
  };
}
export function trackFunnel(event: string, context: Record<string, string> = {}) {
  if (typeof window === "undefined") return;
  const target = window as typeof window & { dataLayer?: unknown[] };
  target.dataLayer = target.dataLayer || [];
  // Google tag command format; queues safely before the tag has loaded.
  // Match the Google tag command queue, which expects an Arguments object.
  // eslint-disable-next-line prefer-rest-params, @typescript-eslint/no-unused-vars
  const command = function (..._args: unknown[]) { target.dataLayer!.push(arguments); };
  command("event", event, { ...context, transport_type: "beacon" });
}
