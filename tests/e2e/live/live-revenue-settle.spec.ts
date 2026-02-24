import { test, expect } from '@playwright/test';
import { loginAs } from '../../fixtures/auth';

let liveId: string;

test.describe('直播結束後延遲分潤結算 E2E 測試', () => {
  test.beforeEach(async ({ page, context }) => {
    await loginAs(page, process.env.KOL_EMAIL!, process.env.KOL_PASSWORD!);
    await page.goto('/dashboard/live/start');
    await page.fill('input[name="title"]', 'E2E 分潤測試直播');
    await page.click('button:has-text("開始直播")');

    await page.waitForSelector('[data-live-id]');
    liveId = await page.getAttribute('[data-live-id]', 'data-live-id') ?? '';

    const viewerPage = await context.newPage();
    await loginAs(viewerPage, process.env.USER_EMAIL!, process.env.USER_PASSWORD!);
    await viewerPage.goto(`/live/${liveId}`);
    await viewerPage.click('button:has-text("購買商品")');
    await viewerPage.click('button:has-text("確認結帳")');
    await viewerPage.waitForURL(/orders\/success/);
    await viewerPage.close();

    await page.goto(`/dashboard/live/${liveId}`);
    await page.click('button:has-text("結束直播")');
  });

  test('直播結束後延遲 1 小時自動結算分潤並通知', async ({ page }) => {
    await page.evaluate(async (lid) => {
      await fetch(`/api/admin/live/${lid}/simulate-2hours`, {
        method: 'POST',
        headers: { 'x-test-mode': 'true' },
      });
    }, liveId);

    await page.evaluate(async () => {
      await fetch('/api/cron/settle-live-revenue', {
        method: 'GET',
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      });
    });

    const commission = await page.evaluate(async (lid) => {
      const res = await fetch(`/api/kol/commission?liveId=${lid}`);
      return await res.json();
    }, liveId);

    expect(commission).toBeTruthy();
    expect(commission.status).toBe('settled');
    expect(commission.amount).toBeGreaterThan(0);

    await loginAs(page, process.env.KOL_EMAIL!, process.env.KOL_PASSWORD!);
    await page.goto('/notifications');
    await expect(page.getByText(/直播分潤已結算/i)).toBeVisible({ timeout: 10000 });
  });
});
