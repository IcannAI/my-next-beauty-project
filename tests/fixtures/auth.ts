import { Page } from '@playwright/test';

const ACCOUNTS = {
  admin: {
    email: process.env.ADMIN_EMAIL ?? 'admin@example.com',
    password: process.env.ADMIN_PASSWORD ?? 'admin123',
  },
  kol: {
    email: process.env.KOL_EMAIL ?? 'kol@example.com',
    password: process.env.KOL_PASSWORD ?? 'kol123',
  },
  user: {
    email: process.env.USER_EMAIL ?? 'test@example.com',
    password: process.env.USER_PASSWORD ?? 'password123',
  },
} as const;


export async function loginAs(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/login');
  await page.waitForSelector('input[name="email"]', { timeout: 10000 });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  await Promise.all([
    page.waitForResponse(
      res => res.url().includes('/api/auth') && res.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null),
    page.click('button[type="submit"]'),
  ]);

  try {
    await page.waitForFunction(
      () => !window.location.pathname.startsWith('/login'),
      { timeout: 15000 }
    );
  } catch {
    const errMsg = await page
      .locator('[role="alert"], p[class*="error"], div[class*="error"]')
      .first()
      .textContent()
      .catch(() => '(no visible error)');

    throw new Error(
      `loginAs("${email}") — 仍停在 /login，登入失敗。\n` +
      `頁面錯誤訊息: ${errMsg}\n\n` +
      `請在 .env 設定正確帳密（ADMIN_EMAIL / KOL_EMAIL / USER_EMAIL 等），\n` +
      `並確認 seed 資料已存在：npx prisma db seed`
    );
  }
}

export async function loginAsAdmin(page: Page): Promise<void> {
  return loginAs(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
}

export async function loginAsKOL(page: Page): Promise<void> {
  return loginAs(page, ACCOUNTS.kol.email, ACCOUNTS.kol.password);
}

export async function loginAsUser(page: Page): Promise<void> {
  return loginAs(page, ACCOUNTS.user.email, ACCOUNTS.user.password);
}

export async function logout(page: Page): Promise<void> {
  const btn = page.locator('button:has-text("登出")');
  if (await btn.isVisible()) {
    await btn.click();
    await page.waitForURL(/login/, { timeout: 5000 });
  }
}