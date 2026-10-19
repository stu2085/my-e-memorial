import { test, expect, type Page } from '@playwright/test';
const user = { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated', email: 'test@example.invalid', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };
const path = '/create?mode=memorial&plan=basic&success=true&session_id=cs_live_fixture';
async function signIn(page: Page) {
  await page.evaluate(user => {
    const payload = btoa(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now()/1000)+3600 }));
    localStorage.setItem('sb-myem-test-auth-token', JSON.stringify({ access_token: `e30.${payload}.test`, refresh_token: 'test-refresh', expires_at: Math.floor(Date.now()/1000)+3600, expires_in: 3600, token_type: 'bearer', user }));
  }, user);
}
async function records(page: Page) { return page.evaluate(() => JSON.parse(sessionStorage.getItem('purchase-test-events') || '[]') as { channel: string; args: unknown[] }[]); }
async function setup(page: Page, payment: Record<string, unknown>, lateGoogle = false, lateMicrosoft = false, deferGoogleUntilAccount = false) {
  await page.addInitScript(({ lateMicrosoft, deferGoogleUntilAccount }) => {
    const w = window as typeof window & { dataLayer: unknown[]; uetq: unknown[] };
    const record = (channel: string, args: unknown[]) => {
      const events = JSON.parse(sessionStorage.getItem('purchase-test-events') || '[]');
      events.push({ channel, args });sessionStorage.setItem('purchase-test-events', JSON.stringify(events));
    };
    w.dataLayer = [];
    w.dataLayer.push = function (...items: unknown[]) { for (const x of items) { const args=Array.from(x as ArrayLike<unknown>);record('google', args);const callback=(args[2] as {event_callback?:()=>void}|undefined)?.event_callback;if(typeof callback==='function' && (!deferGoogleUntilAccount || location.pathname==='/login'))queueMicrotask(()=>{record('google-processed',args);callback();}); } return Array.prototype.push.apply(this, items); };
    if (lateMicrosoft) w.uetq = [];
    else (w as unknown as {uetq:{push:(...items:unknown[])=>void}}).uetq = {push(...items: unknown[]) { record('microsoft', items); }};
  }, { lateMicrosoft, deferGoogleUntilAccount });
  await page.route('**/*', async route => {
    const u = new URL(route.request().url());
    if (u.hostname === 'myem-test.invalid' && u.pathname === '/auth/v1/user') return route.fulfill({ json: user });
    if (u.hostname !== '127.0.0.1') return route.abort();
    if (u.pathname === '/api/verify-payment') {
      if (lateGoogle) await page.evaluate(() => { Object.defineProperty(window, 'gtag', { value: undefined, writable: false }); });
      return route.fulfill({ json: payment });
    }
    if (u.pathname.startsWith('/api/')) return route.fulfill({ json: {} });
    return route.continue();
  });
}
const livePayment = { paid: true, livemode: true, checkoutType: 'standard', plan: 'basic', conversionValue: 49.95, conversionCurrency: 'USD', transactionId: 'cs_live_fixture' };
for (const channel of ['google', 'microsoft']) {
  test(`${channel}: one purchase across sign-in return and refresh`, async ({ page }) => {
    await setup(page, livePayment);
    await page.goto(path);
    await expect(page).toHaveURL(/\/login\?mode=choice/);
    await signIn(page);
    await page.goto(path);
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await page.reload();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    const purchases=(await records(page)).filter(x => x.channel === channel && x.args[0] === 'event' && x.args[1] === 'purchase');
    expect(purchases).toHaveLength(1);
    const details=purchases[0].args[2] as Record<string,unknown>;
    expect(channel === 'google' ? details.value : details.revenue_value).toBe(49.95);
    expect(details.currency).toBe('USD');
    if(channel==='google') { expect(details.transaction_id).toBe('cs_live_fixture');expect(details.plan).toBe('basic');expect(details.memorial_type).toBe('departed'); }
  });
}
test('verified live purchase queues Google event even if gtag is not ready', async ({ page }) => {
  await setup(page, livePayment, true);await page.goto(path);await expect(page).toHaveURL(/\/login\?mode=choice/);
  await expect.poll(async()=>(await records(page)).filter(x=>x.channel==='google'&&x.args[1]==='purchase').length).toBe(1);
});
for (const [label,payment] of [['sandbox', {...livePayment,livemode:false}],['unverified', {...livePayment,paid:false}],['invalid revenue', {...livePayment,conversionValue:0}]] as const) {
  test(`${label} does not emit purchase conversions`, async ({ page }) => {
    await setup(page,payment);await page.goto('/login');await signIn(page);await page.goto(path);
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    if (label === 'sandbox') await expect(page.getByText('✓ Payment Successful', {exact:true})).toBeVisible();
    await page.waitForTimeout(500);
    expect((await records(page)).filter(x=>x.args[0]==='event'&&['purchase','conversion'].includes(String(x.args[1])))).toHaveLength(0);
  });
}

test('Microsoft waits for its runtime and retains payment through the account redirect', async ({ page }) => {
  await setup(page, livePayment, false, true);
  await page.goto(path);await expect(page).toHaveURL(/\/login\?mode=choice/);
  expect((await records(page)).filter(x=>x.channel==='microsoft'&&x.args[1]==='purchase')).toHaveLength(0);
  await page.evaluate(() => {
    (window as unknown as {uetq:unknown}).uetq = { push(...args: unknown[]) {
      const events=JSON.parse(sessionStorage.getItem('purchase-test-events') || '[]');events.push({channel:'microsoft',args});sessionStorage.setItem('purchase-test-events',JSON.stringify(events));
    }};
  });
  await expect.poll(async()=> (await records(page)).filter(x=>x.channel==='microsoft'&&x.args[1]==='purchase').length).toBe(1);
  await page.reload();await expect(page.getByRole('link',{name:'Create New Account'})).toBeVisible();
  expect((await records(page)).filter(x=>x.channel==='microsoft'&&x.args[1]==='purchase')).toHaveLength(1);
});

test('a second verified transaction is counted separately with the server amount', async ({ page }) => {
  await setup(page,livePayment);await page.goto('/login');await signIn(page);
  await page.goto(path);await expect(page.locator('input[name="firstName"]')).toBeVisible();
  await page.route('**/api/verify-payment',route=>route.fulfill({json:{...livePayment,transactionId:'cs_live_second',plan:'plus',conversionValue:59.95}}));
  await page.goto('/create?mode=personal&plan=plus&success=true&session_id=cs_live_second');
  await expect(page.locator('input[name="firstName"]')).toBeVisible();
  const purchases=(await records(page)).filter(x=>x.channel==='google'&&x.args[1]==='purchase');
  expect(purchases).toHaveLength(2);
  expect(purchases[1].args[2]).toMatchObject({transaction_id:'cs_live_second',value:59.95,plan:'plus',memorial_type:'living'});
});

test('unprocessed Google purchase survives navigation and processes on the account screen', async ({ page }) => {
  await setup(page,livePayment,false,false,true);
  await page.goto(path);await expect(page).toHaveURL(/\/login\?mode=choice/);
  await expect.poll(async()=>(await records(page)).filter(x=>x.channel==='google-processed'&&x.args[1]==='purchase').length).toBe(1);
  await signIn(page);await page.goto(path);await expect(page.locator('input[name="firstName"]')).toBeVisible();
  await page.reload();await expect(page.locator('input[name="firstName"]')).toBeVisible();
  expect((await records(page)).filter(x=>x.channel==='google-processed'&&x.args[1]==='purchase')).toHaveLength(1);
});
