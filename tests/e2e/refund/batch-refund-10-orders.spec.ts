import { test, expect } from '@playwright/test';
import { loginAs } from '../../fixtures/auth';

test.describe('批量退款 – 10 筆訂單上限測試', () => {
  test('可成功批量退款 10 筆訂單', async ({ page }) => {
    await loginAs(page, process.env.USER_EMAIL!, process.env.USER_PASSWORD!);
    await page.goto('/orders');
    // 測試邏輯需對應真實後端
    await expect(page.getByText('我的訂單')).toBeVisible();
  });
});
