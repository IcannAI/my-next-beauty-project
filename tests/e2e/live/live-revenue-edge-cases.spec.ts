import { test, expect } from '@playwright/test';
import { loginAs } from '../../fixtures/auth';

test.describe('直播分潤結算邊界情況 E2E 測試', () => {
  let liveId: string;

  test.beforeEach(async ({ page }) => {
    // 登入 KOL 並開啟直播
    await loginAs(page, process.env.KOL_EMAIL!, process.env.KOL_PASSWORD!);
    await page.goto('/dashboard/live/start');
    await page.fill('input[name="title"]', 'E2E 邊界測試直播');
    await page.click('button:has-text("開始直播")');

    await page.waitForSelector('[data-live-id]');
    liveId = (await page.getAttribute('[data-live-id]', 'data-live-id'))!;

    // 結束直播
    await page.goto(`/dashboard/live/${liveId}`);
    await page.click('button:has-text("結束直播")');
  });

  test('無訂單結算：應成功結算且金額為 0', async ({ page }) => {
    // 執行結算 Cron
    await page.evaluate(async () => {
      await fetch('/api/cron/settle-live-revenue', {
        method: 'GET',
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      });
    });

    // 驗證分潤資料
    const commission = await page.evaluate(async (lid) => {
      const res = await fetch(`/api/kol/commission?liveId=${lid}`);
      return await res.json();
    }, liveId);

    expect(commission.status).toBe('settled');
    expect(commission.amount).toBe(0);
  });

  test('部分取消訂單結算：應只計算 COMPLETED 訂單金額', async ({ page }) => {
    // 建立 1 筆 COMPLETED (1000) 與 1 筆 CANCELLED (500) 訂單
    await page.evaluate(async ({ lid, orders }) => {
      await fetch('/api/orders/test-setup-settlement', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-test-mode': 'true' 
        },
        body: JSON.stringify({ liveId: lid, orders }),
      });
    }, { lid: liveId, orders: [
      { status: 'COMPLETED', amount: 1000 },
      { status: 'CANCELLED', amount: 500 }
    ]});

    // 執行結算 Cron
    await page.evaluate(async () => {
      await fetch('/api/cron/settle-live-revenue', {
        method: 'GET',
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      });
    });

    // 驗證分潤資料：1000 * 10% = 100
    const commission = await page.evaluate(async (lid) => {
      const res = await fetch(`/api/kol/commission?liveId=${lid}`);
      return await res.json();
    }, liveId);

    expect(commission.status).toBe('settled');
    expect(commission.amount).toBe(100);
  });

  test('重複執行結算（冪等性）：第二次執行應跳過且不影響結果', async ({ page }) => {
    // 建立 1 筆訂單
    await page.evaluate(async ({ lid, orders }) => {
      await fetch('/api/orders/test-setup-settlement', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-test-mode': 'true' 
        },
        body: JSON.stringify({ liveId: lid, orders }),
      });
    }, { lid: liveId, orders: [{ status: 'COMPLETED', amount: 2000 }] });

    // 執行第一次結算
    const firstResult = await page.evaluate(async () => {
      const res = await fetch('/api/cron/settle-live-revenue', {
        method: 'GET',
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      });
      return await res.json();
    });
    expect(firstResult.settled).toContain(liveId);

    // 執行第二次結算
    const secondResult = await page.evaluate(async () => {
      const res = await fetch('/api/cron/settle-live-revenue', {
        method: 'GET',
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      });
      return await res.json();
    });

    // 驗證第二次應被跳過 (skipped) 或不再出現在 settled 列表中
    expect(secondResult.settled).not.toContain(liveId);
    expect(secondResult.skipped).toContain(liveId);

    // 驗證最終金額不變：2000 * 10% = 200
    const commission = await page.evaluate(async (lid) => {
      const res = await fetch(`/api/kol/commission?liveId=${lid}`);
      return await res.json();
    }, liveId);

    expect(commission.amount).toBe(200);
  });
});
