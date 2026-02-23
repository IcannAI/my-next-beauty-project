import { test, expect } from '@playwright/test';
import { loginAs } from '../../fixtures/auth';

test.describe('批量退款 – 部分失敗案例', () => {
  let validOrderIds: string[] = [];
  let alreadyRefundedOrderId: string;

  test.beforeEach(async ({ page }) => {
    await loginAs(page, process.env.USER_EMAIL!, process.env.USER_PASSWORD!);
    await page.goto('/orders');

    validOrderIds = await page.evaluate(async () => {
      const ids = [];
      for (let i = 0; i < 3; i++) {
        const res = await fetch('/api/orders/test-create-completed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: 'test-product', amount: 1000 }),
        });
        const data = await res.json();
        ids.push(data.orderId);
      }
      return ids;
    });

    alreadyRefundedOrderId = await page.evaluate(async () => {
      const res = await fetch('/api/orders/test-create-completed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: 'test-product', amount: 1500 }),
      });
      const { orderId } = await res.json();

      await fetch('/api/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, reason: '已申請過' }),
      });

      return orderId;
    });
  });

  test('部分訂單可退款、部分不可退款 → 應只處理有效訂單並回報失敗清單', async ({ page }) => {
    await page.goto('/orders');

    for (const id of validOrderIds) {
      await page.check(`input[value="${id}"]`);
    }
    await page.check(`input[value="${alreadyRefundedOrderId}"]`);

    await page.click('button:has-text("批量申請退款")');

    await page.fill('textarea[name="reason"]', '部分失敗測試 - 混合狀態');

    await page.click('button:has-text("確認提交")');

    await expect(page.getByText(/已提交 3 筆退款申請/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/以下訂單無法退款/i)).toBeVisible();
  });
});
