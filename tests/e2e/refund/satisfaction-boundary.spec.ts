import { test, expect } from '@playwright/test';
import { loginAs } from '../../fixtures/auth';
import { prisma } from '@/infrastructure/db/prisma';

test.describe('退款滿意度調查邊界測試', () => {
  let refundId: string;
  let userId: string;

  test.beforeEach(async ({ page }) => {
    // 登入
    const email = process.env.USER_EMAIL || 'test@example.com';
    const password = process.env.USER_PASSWORD || 'password123';
    await loginAs(page, email, password);

    // 建立測試資料：User -> Order -> RefundRequest
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('測試使用者不存在');
    userId = user.id;

    const order = await prisma.order.create({
      data: {
        userId: userId,
        status: 'COMPLETED',
        totalAmount: 100,
        productId: 'test-product',
      },
    });

    const refund = await prisma.refundRequest.create({
      data: {
        orderId: order.id,
        userId: userId,
        reason: '測試退款',
        status: 'APPROVED',
      },
    });
    refundId = refund.id;
  });

  test.afterEach(async () => {
    // 清理測試資料
    if (refundId) {
      const refund = await prisma.refundRequest.findUnique({ where: { id: refundId } });
      if (refund) {
        await prisma.refundRequest.delete({ where: { id: refundId } });
        await prisma.order.delete({ where: { id: refund.orderId } });
      }
    }
  });

  test('1. 1星評分提交 — 填入 rating=1, comment="很差", 確認回傳 200', async ({ page }) => {
    const response = await page.request.post(`/api/refund/${refundId}/feedback`, {
      data: { rating: 1, comment: '很差' }
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    const updated = await prisma.refundRequest.findUnique({ where: { id: refundId } });
    expect(updated?.feedbackRating).toBe(1);
    expect(updated?.feedbackComment).toBe('很差');
    expect(updated?.feedbackSubmitted).toBe(true);
  });

  test('2. 空白評論提交 — 填入 rating=3, comment="", 確認回傳 200', async ({ page }) => {
    const response = await page.request.post(`/api/refund/${refundId}/feedback`, {
      data: { rating: 3, comment: '' }
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    const updated = await prisma.refundRequest.findUnique({ where: { id: refundId } });
    expect(updated?.feedbackRating).toBe(3);
    expect(updated?.feedbackComment).toBe('');
  });

  test('3. 長評論提交 — 填入 rating=5, comment 為 500 字長字串, 確認回傳 200', async ({ page }) => {
    const longComment = 'A'.repeat(500);
    const response = await page.request.post(`/api/refund/${refundId}/feedback`, {
      data: { rating: 5, comment: longComment }
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    const updated = await prisma.refundRequest.findUnique({ where: { id: refundId } });
    expect(updated?.feedbackComment).toBe(longComment);
  });

  test('4. 重複提交 — 同一筆退款提交兩次調查, 確認第二次回傳 400', async ({ page }) => {
    // 第一次提交
    await page.request.post(`/api/refund/${refundId}/feedback`, {
      data: { rating: 4, comment: 'First' }
    });

    // 第二次提交
    const response = await page.request.post(`/api/refund/${refundId}/feedback`, {
      data: { rating: 2, comment: 'Second' }
    });
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('已經提交過評價');
  });

  test('5. 無效評分 — 填入 rating=6（超出範圍）, 確認回傳 400', async ({ page }) => {
    const response = await page.request.post(`/api/refund/${refundId}/feedback`, {
      data: { rating: 6, comment: 'Invalid' }
    });
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('評分必須在 1 到 5 之間');
  });
});
