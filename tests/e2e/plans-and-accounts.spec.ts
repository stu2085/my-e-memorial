import { test, expect, Page } from "@playwright/test";

async function events(page: Page) {
  return page.evaluate(() => JSON.parse(sessionStorage.getItem("test-funnel") || "[]") as unknown[][]);
}
test.beforeEach(async ({ page }) => {
  // Keep event assertions across full-page redirects. No Google/Clarity requests leave this test.
  await page.addInitScript(() => {
    const target = window as typeof window & { dataLayer: unknown[] };
    target.dataLayer = [];
    target.dataLayer.push = function (...items: unknown[]) {
      const records = JSON.parse(sessionStorage.getItem("test-funnel") || "[]");
      for (const item of items) records.push(Array.from(item as ArrayLike<unknown>));
      sessionStorage.setItem("test-funnel", JSON.stringify(records));
      return Array.prototype.push.apply(this, items);
    };
  });
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.hostname !== "127.0.0.1") return route.abort();
    if (url.pathname === "/test-checkout") return route.fulfill({ contentType: "text/html", body: "<h1>Test checkout destination</h1>" });
    if (url.pathname === "/api/checkout") return route.fulfill({ json: { url: "http://127.0.0.1:3100/test-checkout" } });
    if (url.pathname.startsWith("/api/")) return route.fulfill({ json: {} });
    return route.continue();
  });
});

for (const [landing, mode] of [["/memorials", "memorial"], ["/personal-e-memorials", "personal"]] as const) {
  for (const plan of ["free", "basic", "plus", "premium"]) {
    test(`${mode}: ${plan} keeps selection and emits funnel events`, async ({ page }) => {
      let checkoutBody: Record<string, unknown> | undefined;
      await page.route("**/api/checkout", route => {
        checkoutBody = route.request().postDataJSON();
        return route.fulfill({ json: { url: "http://127.0.0.1:3100/test-checkout" } });
      });
      await page.goto(landing);
      if (mode === "personal" && plan !== "free") {
        const title = `${plan[0].toUpperCase()}${plan.slice(1)} Living MyEMemorial`;
        const card = page.locator("#pricing div").filter({
          has: page.getByText(title, { exact: true }),
        }).filter({
          has: page.getByRole("button", { name: "Choose Plan", exact: true }),
        }).last();
        await card.getByRole("button", { name: "Choose Plan", exact: true }).click();
      } else {
        const link = page.locator(`a[href="/create?mode=${mode}&plan=${plan}"]`);
        await expect(link).toHaveCount(1);
        await link.click();
      }
      if (plan === "free") {
        await expect(page).toHaveURL(/\/login\?mode=choice/);
        const redirect = new URL(page.url()).searchParams.get("redirect");
        expect(redirect).toBe(`/create?mode=${mode}&plan=free`);
        await page.getByRole("link", { name: "Create New Account" }).click();
        await expect(page.getByRole("heading", { name: "Create Account", exact: true })).toBeVisible();
        expect(new URL(page.url()).searchParams.get("redirect")).toBe(redirect);
        const records = await events(page);
        await expect.poll(async () => (await events(page)).some(row => row[1] === "account_screen_opened")).toBeTruthy();
        expect(records.some(row => row[1] === "begin_checkout")).toBeFalsy();
        await page.getByRole("link", { name: "Already have an account? Log in" }).click();
        expect(new URL(page.url()).searchParams.get("redirect")).toBe(redirect);
      } else {
        await expect(page).toHaveURL(/test-checkout/);
        expect((await events(page)).some(row => row[1] === "begin_checkout")).toBeTruthy();
        expect(checkoutBody).toMatchObject({ plan, amount: { basic: 4995, plus: 6995, premium: 8995 }[plan] });
        expect(String(checkoutBody?.returnUrl)).toContain(`mode=${mode}&plan=${plan}`);
      }
      const records = await events(page);
      expect(records.some(row => row[1] === "plan_selected" && (row[2] as {plan: string}).plan === plan)).toBeTruthy();
    });
  }
}

test("signup keeps payment return token out of custom events and fits the viewport", async ({ page }) => {
  const redirect = "/create?mode=memorial&plan=plus&session_id=cs_test_private&success=true";
  await page.goto(`/login?mode=signup&redirect=${encodeURIComponent(redirect)}`);
  await expect(page.getByText("The best gift for your loved one so future generations will always remember who they were.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create Account", exact: true })).toBeVisible();
  await expect.poll(() => events(page)).not.toEqual([]);
  expect(JSON.stringify(await events(page))).not.toContain("cs_test_private");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await expect(page.locator('script[src*="clarity.ms"]')).toHaveCount(0);
});

test("Privacy metadata describes privacy, and builder remains noindex", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /collects, uses, and protects/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://www.myememorial.com/privacy");
  await page.goto("/celebration-of-life-slideshow/create");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

for (const mode of ["memorial", "personal"]) {
  test(`${mode}: verified payment return sends a new visitor to account choice`, async ({ page }) => {
    await page.route("**/api/verify-payment", route => route.fulfill({ json: { paid: true } }));
    await page.goto(`/create?mode=${mode}&plan=plus&success=true&session_id=cs_test_private`);
    await expect(page).toHaveURL(/\/login\?mode=choice/);
    const redirect = new URL(page.url()).searchParams.get("redirect") || "";
    expect(redirect).toContain("plan=plus");
    expect(redirect).toContain("session_id=cs_test_private");
    await expect(page.getByRole("link", { name: "Create New Account" })).toBeVisible();
    expect((await events(page)).some(row => row[1] === "begin_checkout")).toBeFalsy();
    expect(JSON.stringify(await events(page))).not.toContain("cs_test_private");
  });
}
