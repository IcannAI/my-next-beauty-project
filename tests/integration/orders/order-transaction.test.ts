// Validates: atomic stock decrement, cancel + restore stock, anomaly detection

import { prisma } from '@/infrastructure/db/prisma';
import { POST as checkoutPOST } from '@/app/api/orders/checkout/route';
import { PATCH as cancelPATCH } from '@/app/api/admin/orders/[id]/cancel/route';
import { createMockRequest } from '../../helpers/mock-request';

// ✅ requireUser/requireAdmin 回傳 null 代表「驗證通過，不攔截」
jest.mock('@/infrastructure/auth/rbac', () => ({
  requireUser: jest.fn().mockResolvedValue(null),
  requireAdmin: jest.fn().mockResolvedValue(null),
}));

// ✅ Mock getCurrentUser — route 內部用來取得目前使用者身份
jest.mock('@/infrastructure/auth/auth', () => ({
  getCurrentUser: jest.fn(),
}));

import { requireUser, requireAdmin } from '@/infrastructure/auth/rbac';
import { getCurrentUser } from '@/infrastructure/auth/auth';

describe('Order Transaction Integrity', () => {
  let userId: string;
  let kolUserId: string;
  let kolProfileId: string;
  let productId: string;

  beforeEach(async () => {
    // Create buyer
    const buyer = await prisma.user.create({
      data: { email: `buyer-${Date.now()}@test.com`, name: 'Buyer' },
    });
    userId = buyer.id;

    // Create KOL + profile + product
    const kol = await prisma.user.create({
      data: { email: `kol-${Date.now()}@test.com`, name: 'KOL', role: 'KOL' },
    });
    kolUserId = kol.id;

    const profile = await prisma.kolProfile.create({
      data: { userId: kolUserId, commissionRate: 0.1 },
    });
    kolProfileId = profile.id;

    const product = await prisma.product.create({
      data: { name: 'Test Product', price: 500, stock: 10, kolProfileId },
    });
    productId = product.id;

    // ✅ 回傳 null → route 的 `if (guard) return guard` 不觸發，繼續執行
    (requireUser as jest.Mock).mockResolvedValue(null);
    (requireAdmin as jest.Mock).mockResolvedValue(null);

    // ✅ 預設為 USER，admin 測試裡會個別覆寫
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: userId, role: 'USER' });
  });

  afterEach(async () => {
    await prisma.notification.deleteMany({ where: { userId } });
    await prisma.order.deleteMany({ where: { userId } });
    await prisma.product.deleteMany({ where: { kolProfileId } });
    await prisma.kolProfile.delete({ where: { id: kolProfileId } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, kolUserId] } } });
  });

  test('Checkout decrements stock atomically', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: JSON.stringify({
        items: [{ productId, quantity: 2, price: 500 }],
      }),
      user: { id: userId },
    });

    const res = await checkoutPOST(req);
    expect(res.status).toBe(200);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product?.stock).toBe(8); // 10 - 2
  });

  test('Checkout rejects if stock insufficient', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: JSON.stringify({
        items: [{ productId, quantity: 999, price: 500 }],
      }),
      user: { id: userId },
    });

    const res = await checkoutPOST(req);
    expect(res.status).toBe(400);

    // Stock unchanged
    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product?.stock).toBe(10);
  });

  test('Checkout rejects tampered price', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: JSON.stringify({
        items: [{ productId, quantity: 1, price: 1 }], // tampered: real price is 500
      }),
      user: { id: userId },
    });

    const res = await checkoutPOST(req);
    expect(res.status).toBe(400);
  });

  test('Admin cancel restores stock', async () => {
    // ✅ Admin 操作，覆寫 getCurrentUser
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: userId, role: 'ADMIN' });

    // Create a PENDING order
    const order = await prisma.order.create({
      data: { userId, productId, status: 'PENDING', totalAmount: 500 },
    });

    // Manually decrement stock (simulates checkout)
    await prisma.product.update({
      where: { id: productId },
      data: { stock: { decrement: 1 } },
    });

    const stockMid = (await prisma.product.findUnique({ where: { id: productId } }))?.stock;
    expect(stockMid).toBe(9);

    const req = createMockRequest({
      method: 'PATCH',
      body: JSON.stringify({ reason: 'Test cancel' }),
      user: { id: userId, role: 'ADMIN' },
    });
    const res = await cancelPATCH(req, { params: Promise.resolve({ id: order.id }) });
    expect(res.status).toBe(200);

    // Stock should be restored
    const after = await prisma.product.findUnique({ where: { id: productId } });
    expect(after?.stock).toBe(10);

    // Order should be CANCELLED
    const cancelled = await prisma.order.findUnique({ where: { id: order.id } });
    expect(cancelled?.status).toBe('CANCELLED');
  });

  test('Cancel creates notification for user', async () => {
    // ✅ Admin 操作，覆寫 getCurrentUser
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: userId, role: 'ADMIN' });

    const order = await prisma.order.create({
      data: { userId, productId, status: 'PENDING', totalAmount: 500 },
    });

    const notifsBefore = await prisma.notification.count({ where: { userId } });

    const req = createMockRequest({
      method: 'PATCH',
      body: JSON.stringify({ reason: 'Duplicate order' }),
      user: { id: userId, role: 'ADMIN' },
    });
    await cancelPATCH(req, { params: Promise.resolve({ id: order.id }) });

    const notifsAfter = await prisma.notification.count({ where: { userId } });
    expect(notifsAfter).toBe(notifsBefore + 1);
  });
});