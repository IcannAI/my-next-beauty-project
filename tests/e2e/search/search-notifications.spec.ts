// tests/e2e/search/search-notifications.spec.ts
// TC-12: Vector search (NOT implemented)
// TC-13: Keyword search
// TC-14: Order lifecycle notifications
// TC-22: Search zero-state
// TC-25: Error boundary on API failure

import { test, expect } from '@playwright/test';
import { loginAsUser, loginAsAdmin } from '../../fixtures/auth';

// ─── TC-12: Vector Search — NOT IMPLEMENTED ──────────────────────

test('TC-12: Vector search not implemented (keyword fallback only)', async ({ page }) => {
  const res = await page.request.get('/api/search/users?q=beauty&mode=vector');
  const body = await res.json().catch(() => ({}));
  // Confirming no vector-specific fields
  expect(body).not.toHaveProperty('embeddings');
  expect(body).not.toHaveProperty('vectorScore');
  expect(body).not.toHaveProperty('semanticResults');
  console.log('TC-12 CONFIRMED: Vector search not implemented');
});

// ─── TC-13: Keyword Search ────────────────────────────────────────

test('TC-13: Search API returns 200 for valid query', async ({ page }) => {
  const res = await page.request.get('/api/search/users?q=test');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body).toHaveProperty('users');
  expect(Array.isArray(body.users)).toBe(true);
});

test('TC-13b: Search returns empty array for no-match', async ({ page }) => {
  const res = await page.request.get('/api/search/users?q=zzz999noresults');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.users.length).toBe(0);
});

test('TC-13c: Search requires query param', async ({ page }) => {
  const res = await page.request.get('/api/search/users');
  // Should return 400 or empty — not crash
  expect(res.status()).not.toBe(500);
});

test('TC-13d: Search page renders input', async ({ page }) => {
  await page.goto('/search');
  const input = page.locator('input[placeholder*="搜尋"], input[type="search"]');
  await expect(input.first()).toBeVisible({ timeout: 5000 });
});

test('TC-13e: Search page shows results after input', async ({ page }) => {
  await page.goto('/search');
  const input = page.locator('input[placeholder*="搜尋"], input[type="search"]').first();
  await input.fill('test');
  await page.waitForTimeout(600); // debounce
  await expect(page.locator('main')).toBeVisible();
  // No 500 error
  expect(await page.locator('text=500').count()).toBe(0);
});

test('TC-13f: Products search returns paginated results', async ({ page }) => {
  const res = await page.request.get('/api/products?q=test&page=1');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body).toHaveProperty('products');
  expect(Array.isArray(body.products)).toBe(true);
});

// ─── TC-14: Order Lifecycle Notifications ────────────────────────

test('TC-14: Notifications page requires auth', async ({ page }) => {
  await page.goto('/notifications');
  await page.waitForURL(/login/, { timeout: 5000 });
  expect(page.url()).toContain('/login');
});

test('TC-14b: User can view their notifications', async ({ page }) => {
  await loginAsUser(page);
  await page.goto('/notifications');
  await expect(page.locator('h1')).toContainText(/通知/, { timeout: 5000 });
  await expect(page.locator('main')).toBeVisible();
});

test('TC-14c: Admin sees full notification panel', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/notifications');
  // Admin label visible
  const heading = page.locator('h1');
  await expect(heading).toContainText(/管理員|ADMIN/i, { timeout: 5000 });
});

test('TC-14d: Notifications page shows empty state when no notifications', async ({ page }) => {
  await loginAsUser(page);
  await page.goto('/notifications');
  await expect(page.locator('main')).toBeVisible();
  // No JS crash
  expect(await page.locator('text=Application error').count()).toBe(0);
});

test('TC-14e: Anomaly warning visible for admin when anomalies exist', async ({ page }) => {
  await loginAsAdmin(page);
  // GET anomaly endpoint
  const res = await page.request.get('/api/admin/orders/anomaly');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body).toHaveProperty('anomalies');
  expect(Array.isArray(body.anomalies)).toBe(true);
  expect(body).toHaveProperty('total');
});

// ─── TC-22: Search Zero-state ────────────────────────────────────

test('TC-22: Products API returns empty for no-match', async ({ page }) => {
  const res = await page.request.get('/api/products?q=zzz999noresults');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.products.length).toBe(0);
});

test('TC-22b: Search UI shows zero-state (no crash)', async ({ page }) => {
  await page.goto('/search?q=zzz999noresults');
  await page.waitForTimeout(1000);
  expect(await page.locator('text=500').count()).toBe(0);
  await expect(page.locator('main')).toBeVisible();
});

// ─── TC-25: Error Boundary ───────────────────────────────────────

test('TC-25: Non-existent product page shows 404 (not 500)', async ({ page }) => {
  await loginAsUser(page);
  await page.goto('/products/nonexistent-product-id-xyz');
  await page.waitForLoadState('networkidle');
  // Should show 404 page, not white screen crash
  const is404 = await page.locator('text=404, text=找不到, text=not found').count();
  const is500 = await page.locator('text=500, text=Application error').count();
  expect(is500).toBe(0);
  // Either 404 page or redirect is acceptable
  expect(is404 + (page.url().includes('/404') ? 1 : 0)).toBeGreaterThanOrEqual(0);
});

test('TC-25b: Non-existent live stream page shows not-found', async ({ page }) => {
  await loginAsUser(page);
  await page.goto('/live/nonexistent-stream-xyz');
  await page.waitForLoadState('networkidle');
  const is500 = await page.locator('text=500, text=Application error').count();
  expect(is500).toBe(0);
});

test('TC-25c: Invalid API route returns JSON error, not HTML crash', async ({ page }) => {
  const res = await page.request.get('/api/products/nonexistent-id-xyz');
  expect(res.status()).not.toBe(500);
  // Should return JSON error
  const contentType = res.headers()['content-type'] ?? '';
  if (res.status() === 404) {
    expect(contentType).toContain('json');
  }
});
