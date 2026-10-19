import { test, expect } from '@playwright/test';

for (const path of ['/', '/memorials']) {
  test(`name-first ${path}: signup return preserves name, isolates prior draft, refresh keeps edits`, async ({ page }) => {
    const user = { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated', email: 'test@example.invalid', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };
    await page.route('**/*', async route => {
      const u = new URL(route.request().url());
      if (u.hostname === 'myem-test.invalid' && u.pathname === '/auth/v1/user') return route.fulfill({ json: user });
      if (u.hostname !== '127.0.0.1') return route.abort();
      if (u.pathname.startsWith('/api/')) return route.fulfill({ json: {} });
      return route.continue();
    });
    await page.addInitScript(() => {
      const w = window as typeof window & { dataLayer: unknown[] };
      w.dataLayer = [];
      w.dataLayer.push = function (...items: unknown[]) {
        const events = JSON.parse(sessionStorage.getItem('name-entry-events') || '[]');
        for (const item of items) events.push(Array.from(item as ArrayLike<unknown>));
        sessionStorage.setItem('name-entry-events', JSON.stringify(events));
        return Array.prototype.push.apply(this, items);
      };
    });
    await page.goto(path);
    await page.evaluate(() => {
      localStorage.setItem('memorialDraft', JSON.stringify({ firstName: 'Previous', lastName: 'Person', lifeStory: 'Keep previous work', plan: 'premium' }));
      localStorage.setItem('guidedDraftMemorialId', '999');
    });
    const form = page.getByRole('form', { name: 'Begin a MyEMemorial' });
    await expect(form).toHaveAttribute('data-clarity-mask', 'true');
    await form.getByLabel('Their first name').fill('Ada');
    await form.getByLabel('Their last name').fill('Lovelace');
    await form.getByRole('button', { name: 'Begin Their MyEMemorial', exact: true }).click();
    await expect(page).toHaveURL(/\/login\?mode=choice/);
    expect(page.url()).not.toMatch(/Ada|Lovelace/);
    const events = await page.evaluate(() => sessionStorage.getItem('name-entry-events') || '[]');
    expect(events).toContain('memorial_name_submitted');
    expect(events).not.toMatch(/Ada|Lovelace/);
    const redirect = new URL(page.url()).searchParams.get('redirect')!;
    expect(redirect).toContain('name_entry=');
    await page.getByRole('link', { name: 'Create New Account' }).click();
    expect(new URL(page.url()).searchParams.get('redirect')).toBe(redirect);
    const token = new URL(redirect, 'http://127.0.0.1').searchParams.get('name_entry')!;
    // Simulate a completed email confirmation/sign-in without sending an email.
    await page.evaluate(({ user }) => {
      const payload = btoa(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now()/1000)+3600 }));
      localStorage.setItem('sb-myem-test-auth-token', JSON.stringify({ access_token: `e30.${payload}.test`, refresh_token: 'test-refresh', expires_at: Math.floor(Date.now()/1000)+3600, expires_in: 3600, token_type: 'bearer', user }));
    }, { user });
    await page.goto(redirect);
    await expect(page.locator('input[name="firstName"]')).toHaveValue('Ada');
    await expect(page.locator('input[name="lastName"]')).toHaveValue('Lovelace');
    const backup = await page.evaluate(token => JSON.parse(localStorage.getItem(`myememorialBeforeNameEntry:${token}`) || '{}'), token);
    expect(JSON.parse(backup.memorialDraft).firstName).toBe('Previous');
    expect(await page.evaluate(() => localStorage.getItem('guidedDraftMemorialId'))).not.toBe('999');
    await page.locator('input[name="firstName"]').fill('Augusta Ada');
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('memorialDraft') || '{}').firstName)).toBe('Augusta Ada');
    await page.reload();
    await expect(page.locator('input[name="firstName"]')).toHaveValue('Augusta Ada');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await expect(page.locator('script[src*="clarity.ms"]')).toHaveCount(0);
  });
}
