import { test, expect } from '@playwright/test';
import { loginAs } from '../../fixtures/auth';

test.describe('搜尋功能 E2E 測試', () => {
  test.beforeEach(async ({ page }) => {
    // 登入並進入搜尋頁面
    await loginAs(page, process.env.USER_EMAIL!, process.env.USER_PASSWORD!);
    await page.goto('/search');
  });

  test('無結果搜尋：顯示「沒有找到相關結果」', async ({ page }) => {
    const input = page.locator('input[placeholder*="搜尋"]');
    await input.fill('xyznonexistent123');
    
    // 等待 debounce (400ms) 與 API 回應
    await expect(page.getByText('沒有找到相關結果')).toBeVisible({ timeout: 5000 });
  });

  test('有結果搜尋：顯示搜尋結果列表', async ({ page }) => {
    const input = page.locator('input[placeholder*="搜尋"]');
    // 使用 'test' 關鍵字，預期系統中有包含 'test' 的資料
    await input.fill('test');
    
    // 驗證是否出現 Card 元件（搜尋結果）
    await expect(page.locator('.lucide-users, .lucide-shopping-bag, .lucide-video, .lucide-newspaper').first()).toBeVisible({ timeout: 5000 });
  });

  test('輸入少於兩個字：顯示「輸入至少兩個字開始搜尋」', async ({ page }) => {
    const input = page.locator('input[placeholder*="搜尋"]');
    await input.fill('a');
    
    await expect(page.getByText('輸入至少兩個字開始搜尋')).toBeVisible();
  });

  test('debounce 延遲測試：快速輸入應只發出一次請求', async ({ page }) => {
    const input = page.locator('input[placeholder*="搜尋"]');
    
    // 監聽 API 請求
    let requestCount = 0;
    page.on('request', request => {
      if (request.url().includes('/api/search') && !request.url().includes('/api/search/')) {
        requestCount++;
      }
    });

    // 快速連續輸入
    await input.type('t', { delay: 50 });
    await input.type('e', { delay: 50 });
    await input.type('s', { delay: 50 });
    await input.type('t', { delay: 50 });

    // 等待一段時間確保 debounce 觸發且只發出一次請求
    await page.waitForTimeout(1000);

    // 驗證請求次數。注意：初始載入可能會因為 useEffect 觸發一次（如果是空字串或初始 query）
    // 但根據代碼，query 為空時 fetchSearch 會直接 return 不發出 fetch。
    // 所以預期只有最後一次 'test' 會觸發。
    expect(requestCount).toBe(1);
  });
});
