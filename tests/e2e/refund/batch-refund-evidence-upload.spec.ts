import { test, expect } from '@playwright/test';
import { loginAs } from '../../fixtures/auth';

test.describe('批量退款 - 證據多檔上傳 E2E 測試', () => {
  let orderIds: string[] = [];

  test.beforeEach(async ({ page }) => {
    await loginAs(page, process.env.USER_EMAIL!, process.env.USER_PASSWORD!);
    await page.goto('/orders');

    orderIds = await page.evaluate(async () => {
      const ids = [];
      for (let i = 0; i < 2; i++) {
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

    expect(orderIds.length).toBe(2);
  });

  test('批量退款 - 成功上傳多檔證據並驗證 S3 URL 儲存', async ({ page }) => {
    await page.goto('/orders');

    await page.check(`input[value="${orderIds[0]}"]`);
    await page.check(`input[value="${orderIds[1]}"]`);

    await page.click('button:has-text("批量申請退款")');

    await page.fill('textarea[name="reason"]', '多檔證據測試');

    await page.setInputFiles('input[type="file"][multiple]', [
      'tests/fixtures/proof1.jpg',
      'tests/fixtures/proof2.png',
    ]);

    await page.click('button:has-text("確認提交")');

    await expect(page.getByText(/2 筆退款申請已提交/i)).toBeVisible({ timeout: 15000 });

    const refunds = await page.evaluate(async (ids) => {
      const res = await fetch(`/api/refund?orderIds=${ids.join(',')}`);
      return await res.json();
    }, orderIds);

    expect(refunds.length).toBe(2);
    for (const refund of refunds) {
      expect(Array.isArray(refund.evidenceUrls)).toBe(true);
      expect(refund.evidenceUrls.length).toBe(2);
      expect(refund.evidenceUrls[0]).toMatch(/^https?:\/\/.*\.s3\./);
    }
  });
});
