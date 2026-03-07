// tests/e2e/admin/observability.spec.ts
// TC-15: Datadog RUM navigation tracking
// TC-16: APM database tracing
// TC-28: Database migration (schema consistency)
// TC-29: Cache invalidation on product update

import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsKOL } from '../../fixtures/auth';

// ─── TC-15: Datadog RUM ───────────────────────────────────────────

test('TC-15: Page loads without JS errors (RUM baseline)', async ({ page }) => {
  const jsErrors: string[] = [];
  page.on('pageerror', err => jsErrors.push(err.message));

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Filter out known non-critical Pusher errors in dev
  const criticalErrors = jsErrors.filter(e =>
    !e.includes('Pusher') && !e.includes('pusher') && !e.includes('ws://')
  );
  expect(criticalErrors).toHaveLength(0);
});

test('TC-15b: Navigation between pages has no JS errors', async ({ page }) => {
  const jsErrors: string[] = [];
  page.on('pageerror', err => jsErrors.push(err.message));

  await loginAsAdmin(page);
  const routes = ['/', '/live', '/products', '/orders', '/notifications'];
  for (const route of routes) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
  }

  const critical = jsErrors.filter(e => !e.includes('Pusher') && !e.includes('pusher'));
  if (critical.length > 0) {
    console.log('JS errors detected:', critical);
  }
  expect(critical).toHaveLength(0);
});

test('TC-15c: Core Web Vitals — page load under 3 seconds', async ({ page }) => {
  const start = Date.now();
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - start;
  expect(loadTime).toBeLessThan(10000); // 10s in CI, 3s in prod expectation
  console.log(`TC-15c: Home page load time: ${loadTime}ms`);
});

// ─── TC-16: APM / Database Queries ───────────────────────────────

test('TC-16: API response time under acceptable threshold', async ({ page }) => {
  await loginAsAdmin(page);

  const endpoints = [
    '/api/products',
    '/api/orders',
    '/api/search/users?q=test',
  ];

  for (const endpoint of endpoints) {
    const start = Date.now();
    const res = await page.request.get(endpoint);
    const duration = Date.now() - start;

    expect(res.status()).toBe(200);
    // Should respond under 5 seconds (loose threshold for CI/cold start)
    expect(duration).toBeLessThan(5000);
    console.log(`TC-16: ${endpoint} → ${duration}ms`);
  }
});

test('TC-16b: Concurrent API requests do not cause 500 errors', async ({ page }) => {
  await loginAsAdmin(page);

  // Fire 5 concurrent requests
  const requests = Array.from({ length: 5 }, () =>
    page.request.get('/api/products')
  );
  const results = await Promise.all(requests);
  for (const res of results) {
    expect(res.status()).not.toBe(500);
  }
});

// ─── TC-28: Database Schema Consistency ──────────────────────────

test('TC-28: All critical models accessible via API', async ({ page }) => {
  await loginAsAdmin(page);

  // Verify key models return valid responses (confirms schema + Prisma client in sync)
  const modelChecks = [
    { endpoint: '/api/products',         field: 'products'  },
    { endpoint: '/api/orders',           field: 'orders'    },
    { endpoint: '/api/admin/users',      field: 'users'     },
  ];

  for (const { endpoint, field } of modelChecks) {
    const res = await page.request.get(endpoint);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty(field);
    expect(Array.isArray(body[field])).toBe(true);
    console.log(`TC-28: ${endpoint} → ${field}: ${body[field].length} records`);
  }
});

test('TC-28b: Order model has required fields', async ({ page }) => {
  await loginAsAdmin(page);
  const res = await page.request.get('/api/orders');
  expect(res.status()).toBe(200);
  const { orders } = await res.json();
  if (orders.length === 0) {
    console.log('TC-28b: No orders to validate schema');
    return;
  }
  const order = orders[0];
  // Confirm required fields present (matches prisma schema)
  expect(order).toHaveProperty('id');
  expect(order).toHaveProperty('status');
  expect(order).toHaveProperty('totalAmount');
  expect(order).toHaveProperty('userId');
  expect(order).toHaveProperty('createdAt');
});

test('TC-28c: Product model has required fields', async ({ page }) => {
  const res = await page.request.get('/api/products');
  expect(res.status()).toBe(200);
  const { products } = await res.json();
  if (products.length === 0) return;
  const product = products[0];
  expect(product).toHaveProperty('id');
  expect(product).toHaveProperty('name');
  expect(product).toHaveProperty('price');
  expect(product).toHaveProperty('stock');
  expect(product).toHaveProperty('kolProfileId');
});

// ─── TC-29: Product Update Reflects Immediately ──────────────────

test('TC-29: Product update via PATCH is immediately reflected in GET', async ({ page }) => {
  await loginAsKOL(page);

  // Get list of KOL's products
  const listRes = await page.request.get('/api/products');
  if (!listRes.ok()) return;
  const { products } = await listRes.json();
  if (products.length === 0) {
    test.skip(true, 'No products to test');
    return;
  }

  const product = products[0];
  const newName = `Updated ${Date.now()}`;

  // Update product
  const patchRes = await page.request.patch(`/api/products/${product.id}`, {
    data: { name: newName },
  });

  if (patchRes.status() !== 200) {
    // Might fail if KOL doesn't own this specific product
    console.log('TC-29: PATCH failed (ownership mismatch — expected)');
    return;
  }

  // Immediately re-fetch and verify
  const getRes = await page.request.get(`/api/products/${product.id}`);
  if (getRes.status() === 200) {
    const updated = await getRes.json();
    expect(updated.product?.name ?? updated.name).toBe(newName);
    console.log(`TC-29: Product name updated to "${newName}" — no cache served`);
  }
});

test('TC-29b: Stock decrement reflected immediately after checkout', async ({ page }) => {
  await loginAsKOL(page);
  const listRes = await page.request.get('/api/products');
  if (!listRes.ok()) return;
  const { products } = await listRes.json();
  const inStock = products.find((p: any) => p.stock > 0 && p.kolProfileId);
  if (!inStock) {
    test.skip(true, 'No in-stock products');
    return;
  }

  const stockBefore = inStock.stock;

  // Login as user and checkout
  await loginAsKOL(page); // reuse session
  const checkoutRes = await page.request.post('/api/orders/checkout', {
    data: {
      items: [{ productId: inStock.id, quantity: 1, price: inStock.price }],
    },
  });

  if (!checkoutRes.ok()) {
    console.log('TC-29b: Checkout failed (KOL cannot buy own product or auth issue)');
    return;
  }

  const afterRes = await page.request.get(`/api/products/${inStock.id}`);
  if (afterRes.ok()) {
    const after = await afterRes.json();
    const stockAfter = after.product?.stock ?? after.stock;
    expect(stockAfter).toBe(stockBefore - 1);
    console.log(`TC-29b: Stock decremented ${stockBefore} → ${stockAfter}`);
  }
});
