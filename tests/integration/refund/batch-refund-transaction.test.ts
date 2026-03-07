// Validates: batch refund atomicity, rollback on partial failure

import { prisma } from '@/infrastructure/db/prisma';
import { POST } from '@/app/api/refund/batch/route';
import { createMockRequest } from '../../helpers/mock-request';

// ✅ requireUser 回傳 null 代表「驗證通過，不攔截」
jest.mock('@/infrastructure/auth/rbac', () => ({
  requireUser: jest.fn().mockResolvedValue(null),
  requireAdmin: jest.fn().mockResolvedValue(null),
}));

// ✅ Mock getCurrentUser — route 內部用來取得目前使用者身份
jest.mock('@/infrastructure/auth/auth', () => ({
  getCurrentUser: jest.fn(),
}));

import { requireUser } from '@/infrastructure/auth/rbac';
import { getCurrentUser } from '@/infrastructure/auth/auth';

describe('批量退款 - 交易完整性測試', () => {
  let userId: string;
  let kolUserId: string;
  let kolProfileId: string;
  let productId: string;
  let orderIds: string[] = [];

  beforeEach(async () => {
    // ✅ 建立 User
    const user = await prisma.user.create({
      data: { email: `batch-refund-${Date.now()}@test.com`, name: 'Test User' },
    });
    userId = user.id;

    // ✅ 建立 KOL + KolProfile（Product 需要 kolProfileId）
    const kol = await prisma.user.create({
      data: { email: `kol-refund-${Date.now()}@test.com`, name: 'KOL', role: 'KOL' },
    });
    kolUserId = kol.id;

    const profile = await prisma.kolProfile.create({
      data: { userId: kolUserId, commissionRate: 0.1 },
    });
    kolProfileId = profile.id;

    // ✅ 建立真實 Product（避免 Foreign key constraint violated）
    const product = await prisma.product.create({
      data: { name: 'Refund Test Product', price: 1000, stock: 99, kolProfileId },
    });
    productId = product.id;

    // ✅ 建立 3 筆 Order，使用真實 productId
    orderIds = [];
    for (let i = 0; i < 3; i++) {
      const order = await prisma.order.create({
        data: { userId, productId, status: 'COMPLETED', totalAmount: 1000 },
      });
      orderIds.push(order.id);
    }

    // ✅ 回傳 null → route 不被攔截；getCurrentUser 回傳真實 userId
    (requireUser as jest.Mock).mockResolvedValue(null);
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: userId, role: 'USER' });
  });

  afterEach(async () => {
    await prisma.refundRequest.deleteMany({ where: { userId } });
    await prisma.order.deleteMany({ where: { userId } });
    await prisma.product.deleteMany({ where: { kolProfileId } });
    await prisma.kolProfile.delete({ where: { id: kolProfileId } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, kolUserId] } } });
    orderIds = [];
    jest.restoreAllMocks(); // ✅ 清除 spyOn，避免影響其他測試
  });

  test('正常情況：全部成功', async () => {
    const mockReq = createMockRequest({
      method: 'POST',
      body: JSON.stringify({ orderIds, reason: '正常退款測試原因' }),
      user: { id: userId },
    });

    const response = await POST(mockReq);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.count).toBe(3);

    const refunds = await prisma.refundRequest.findMany({ where: { userId } });
    expect(refunds.length).toBe(3);
  });

  test('交易中途失敗 → 全部 rollback', async () => {
    // ✅ 直接 mock $transaction 拋出錯誤，模擬 DB 事務失敗
    // 原本用「預先建立 refundRequest」的方式會讓 route 的前置驗證就回傳 400，
    // 根本進不到 $transaction，所以改用 spyOn 強制讓事務層拋出錯誤
    jest.spyOn(prisma, '$transaction').mockRejectedValueOnce(
      new Error('模擬資料庫事務失敗')
    );

    const mockReq = createMockRequest({
      method: 'POST',
      body: JSON.stringify({ orderIds, reason: '交易失敗測試原因' }),
      user: { id: userId },
    });

    const response = await POST(mockReq);
    expect(response.status).toBe(500);

    // ✅ $transaction 根本沒執行，DB 不應有任何新增退款
    const refunds = await prisma.refundRequest.findMany({ where: { userId } });
    expect(refunds.length).toBe(0);
  });
});