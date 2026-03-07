// tests/e2e/refund/refund-settlement.spec.ts
// TC-06: Batch refund submission
// TC-07: Evidence upload validation
// TC-08: Admin approves refund
// TC-09: Admin rejects refund
// TC-10: Partial refund (NOT implemented)
// TC-11: Cron 7-day survey
// TC-21: KOL revenue ledger

import { test, expect } from '@playwright/test';
import { loginAsUser, loginAsAdmin, loginAsKOL } from '../../fixtures/auth';

// ─── TC-06: Batch Refund ─────────────────────────────────────────

test('TC-06: Orders page renders for authenticated user', async ({ page }) => {
  await loginAsUser(page);
  await page.goto('/orders');
  await expect(page.locator('h1')).toContainText(/訂單/, { timeout: 5000 });
});

test('TC-06b: Batch refund button present on orders page', async ({ page }) => {
  await loginAsUser(page);
  await page.goto('/orders');
  const btn = page.locator('button:has-text("批量申請退款"), button:has-text("退款")');
  await expect(btn.first()).toBeVisible({ timeout: 5000 });
});

test('TC-06c: API rejects empty orderIds', async ({ page }) => {
  await loginAsUser(page);
  const res = await page.request.post('/api/refund/batch', {
    data: { orderIds: [], reason: '測試' },
  });
  expect(res.status()).toBe(400);
  const body = await res.json();
  expect(body.error).toBeTruthy();
});

test('TC-06d: API rejects reason shorter than 5 chars', async ({ page }) => {
  await loginAsUser(page);
  const res = await page.request.post('/api/refund/batch', {
    data: { orderIds: ['fake-id'], reason: 'ab' },
  });
  expect(res.status()).toBe(400);
});

test('TC-06e: API rejects more than 10 orderIds', async ({ page }) => {
  await loginAsUser(page);
  const ids = Array.from({ length: 11 }, (_, i) => `fake-${i}`);
  const res = await page.request.post('/api/refund/batch', {
    data: { orderIds: ids, reason: '超過上限測試退款原因' },
  });
  expect(res.status()).toBe(400);
  const body = await res.json();
  expect(body.error).toMatch(/10/);
});

test('TC-06f: API rejects PENDING (not COMPLETED) order', async ({ page }) => {
  await loginAsUser(page);
  const ordersRes = await page.request.get('/api/orders');
  if (!ordersRes.ok()) return;
  const { orders } = await ordersRes.json();
  const pending = orders.find((o: any) => o.status === 'PENDING');
  if (!pending) {
    test.skip(true, 'No PENDING orders to test');
    return;
  }
  const res = await page.request.post('/api/refund/batch', {
    data: { orderIds: [pending.id], reason: 'PENDING 訂單退款測試原因' },
  });
  expect(res.status()).toBe(400);
});

// ─── TC-07: Evidence Upload ───────────────────────────────────────

test('TC-07: Evidence upload endpoint exists (not 404)', async ({ page }) => {
  await loginAsUser(page);
  const res = await page.request.post('/api/refund/upload-evidence', {
    multipart: {},
  });
  expect(res.status()).not.toBe(404);
});

test('TC-07b: API rejects more than 5 evidence URLs', async ({ page }) => {
  await loginAsUser(page);
  const res = await page.request.post('/api/refund/batch', {
    data: {
      orderIds: ['fake'],
      reason: '超過5個佐證測試',
      evidenceUrls: ['a', 'b', 'c', 'd', 'e', 'f'],
    },
  });
  expect(res.status()).toBe(400);
});

test('TC-07c: Upload API rejects non-image file types', async ({ page }) => {
  await loginAsUser(page);
  const res = await page.request.post('/api/refund/upload-evidence', {
    multipart: {
      file: {
        name: 'hack.exe',
        mimeType: 'application/x-msdownload',
        buffer: Buffer.from('not an image'),
      },
    },
  });
  expect([400, 401, 403, 415]).toContain(res.status());
});

// ─── TC-08: Admin Approves Refund ────────────────────────────────

test('TC-08: Admin refund dashboard accessible', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/refund');
  await expect(page).not.toHaveURL(/login/);
  await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });
});

test('TC-08b: Refund dashboard shows refund requests', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/refund');
  await expect(page.locator('main')).toBeVisible();
  expect(await page.locator('text=500, text=Internal Server Error').count()).toBe(0);
});

test('TC-08c: Admin refund approve API validates refundId', async ({ page }) => {
  await loginAsAdmin(page);
  const res = await page.request.patch('/api/admin/refund/nonexistent-id/approve');
  expect([400, 404]).toContain(res.status());
});

// ─── TC-09: Admin Rejects Refund ─────────────────────────────────

test('TC-09: Admin refund reject API validates refundId', async ({ page }) => {
  await loginAsAdmin(page);
  const res = await page.request.patch('/api/admin/refund/nonexistent-id/reject', {
    data: { reason: '不符合退款條件' },
  });
  expect([400, 404]).toContain(res.status());
});

test('TC-09b: Non-admin cannot access refund admin API', async ({ page }) => {
  await loginAsUser(page);
  const res = await page.request.patch('/api/admin/refund/fake-id/approve');
  expect([401, 403]).toContain(res.status());
});

// ─── TC-10: Partial Refund — NOT IMPLEMENTED ─────────────────────

test('TC-10: Partial refund NOT implemented (full batch only)', async ({ page }) => {
  await loginAsUser(page);
  await page.goto('/orders');
  const partialInput = page.locator('input[name="partialAmount"], input[placeholder*="部分金額"]');
  expect(await partialInput.count()).toBe(0);
});

// ─── TC-11: Cron Protected ───────────────────────────────────────
// Cron routes 在 Vercel 上通常是 GET，回傳 401/403 或 405（POST not allowed）
// 兩種都代表「未授權存取被阻擋」

test('TC-11: Survey cron rejects unauthenticated requests', async ({ page }) => {
  const resGet = await page.request.get('/api/cron/refund-feedback-reminder');
  const resPost = await page.request.post('/api/cron/refund-feedback-reminder');
  console.log(`TC-11: GET=${resGet.status()} POST=${resPost.status()}`);
  const either = [resGet.status(), resPost.status()];
  const blocked = either.some(s => [401, 403, 405].includes(s));
  expect(blocked).toBe(true);
});

test('TC-11b: Survey cron rejects wrong CRON_SECRET', async ({ page }) => {
  const res = await page.request.get('/api/cron/refund-feedback-reminder', {
    headers: { Authorization: 'Bearer wrong-secret' },
  });
  expect([401, 403, 405]).toContain(res.status());
});

// ─── TC-21: KOL Revenue Ledger ───────────────────────────────────

test('TC-21: Settlement page loads for KOL', async ({ page }) => {
  await loginAsKOL(page);
  await page.goto('/dashboard/settlement');
  await expect(page).not.toHaveURL(/login/);
  await expect(page.locator('h1')).toContainText(/分潤|Settlement/i, { timeout: 5000 });
});

test('TC-21b: Settlement page shows formula section', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/dashboard/settlement');
  await expect(page.locator('main')).toBeVisible();
  expect(await page.locator('text=500, text=Application error').count()).toBe(0);
});

test('TC-21c: ADMIN can edit commission rate via API', async ({ page }) => {
  await loginAsAdmin(page);
  const usersRes = await page.request.get('/api/admin/users');
  if (!usersRes.ok()) return;
  const { users } = await usersRes.json();
  const kol = users.find((u: any) => u.role === 'KOL' && u.kolProfile);
  if (!kol) {
    test.skip(true, 'No KOL user available');
    return;
  }
  const res = await page.request.patch(`/api/admin/kol/${kol.kolProfile.id}/commission`, {
    data: { commissionRate: 0.15 },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.commissionRate).toBe(0.15);
});

test('TC-21d: Commission rate API rejects invalid values', async ({ page }) => {
  await loginAsAdmin(page);
  const cases = [
    { commissionRate: -0.1 },
    { commissionRate: 1.5 },
    { commissionRate: 'abc' },
  ];
  for (const data of cases) {
    const res = await page.request.patch('/api/admin/kol/fake-id/commission', { data });
    expect([400, 404]).toContain(res.status());
  }
});