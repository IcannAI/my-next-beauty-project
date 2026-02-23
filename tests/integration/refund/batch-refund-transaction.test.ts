import { prisma } from '@/infrastructure/db/prisma';
import { POST } from '@/app/api/refund/batch/route';
import { createMockRequest } from '../../helpers/mock-request';

describe('批量退款 - 交易完整性測試', () => {
  let userId: string;
  let orderIds: string[] = [];

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: { email: 'test-batch@refund.com', name: 'Test User' },
    });
    userId = user.id;

    for (let i = 0; i < 3; i++) {
      const order = await prisma.order.create({
        data: {
          userId,
          status: 'COMPLETED',
          totalAmount: 1000,
          productId: 'test-product',
        },
      });
      orderIds.push(order.id);
    }
  });

  afterEach(async () => {
    await prisma.refundRequest.deleteMany({ where: { userId } });
    await prisma.order.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    orderIds = [];
  });

  test('正常情況：全部成功', async () => {
    const mockReq = createMockRequest({
      method: 'POST',
      body: JSON.stringify({ orderIds, reason: '正常測試' }),
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
    await prisma.refundRequest.create({
      data: {
        orderId: orderIds[1],
        userId,
        reason: '預先衝突',
        status: 'PENDING',
      },
    });

    const mockReq = createMockRequest({
      method: 'POST',
      body: JSON.stringify({ orderIds, reason: '失敗測試' }),
      user: { id: userId },
    });

    const response = await POST(mockReq);

    expect(response.status).toBe(500);

    const refunds = await prisma.refundRequest.findMany({ where: { userId } });
    expect(refunds.length).toBe(1);
  });
});
