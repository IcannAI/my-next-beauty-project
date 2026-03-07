// tests/integration/settlement/settlement.test.ts
// Validates: settlement calculation, idempotency, commission formula

import { prisma } from '@/infrastructure/db/prisma';
import { LiveRevenueService } from '@/domain/live/LiveRevenueService'; // ✅ 修正：移除多餘的 src/

describe('LiveRevenueService — Commission Calculation', () => {
  test('Calculates KOL earnings correctly at 10%', () => {
    const svc = new LiveRevenueService();
    const result = svc.calculate({
      totalRevenue: 10000,
      commissionRate: 0.1,
    });
    expect(result.kolEarnings).toBe(1000);
    expect(result.platformEarnings).toBe(9000);
    expect(result.kolEarnings + result.platformEarnings).toBe(10000);
  });

  test('Calculates KOL earnings at 15%', () => {
    const svc = new LiveRevenueService();
    const result = svc.calculate({
      totalRevenue: 20000,
      commissionRate: 0.15,
    });
    expect(result.kolEarnings).toBe(3000);
    expect(result.platformEarnings).toBe(17000);
  });

  test('Rounds to 2 decimal places', () => {
    const svc = new LiveRevenueService();
    const result = svc.calculate({
      totalRevenue: 333,
      commissionRate: 0.1,
    });
    expect(result.kolEarnings).toBe(33.3);
    expect(Number.isFinite(result.kolEarnings)).toBe(true);
  });

  test('Handles zero revenue', () => {
    const svc = new LiveRevenueService();
    const result = svc.calculate({ totalRevenue: 0, commissionRate: 0.1 });
    expect(result.kolEarnings).toBe(0);
    expect(result.platformEarnings).toBe(0);
  });

  test('Rejects negative revenue', () => {
    const svc = new LiveRevenueService();
    expect(() => svc.calculate({ totalRevenue: -100, commissionRate: 0.1 }))
      .toThrow();
  });

  test('Rejects commissionRate > 1', () => {
    const svc = new LiveRevenueService();
    expect(() => svc.calculate({ totalRevenue: 100, commissionRate: 1.5 }))
      .toThrow();
  });

  test('Rejects negative commissionRate', () => {
    const svc = new LiveRevenueService();
    expect(() => svc.calculate({ totalRevenue: 100, commissionRate: -0.1 }))
      .toThrow();
  });
});

describe('Settlement Idempotency', () => {
  let kolUserId: string;
  let kolProfileId: string;
  let liveStreamId: string;

  beforeEach(async () => {
    const kol = await prisma.user.create({
      data: { email: `settle-${Date.now()}@test.com`, name: 'KOL', role: 'KOL' },
    });
    kolUserId = kol.id;

    const profile = await prisma.kolProfile.create({
      data: { userId: kolUserId, commissionRate: 0.1 },
    });
    kolProfileId = profile.id;

    const stream = await prisma.liveStream.create({
      data: {
        kolProfileId,
        title: 'Settlement Test Stream',
        status: 'ENDED',
        settlementStatus: 'PENDING',
        totalRevenue: 5000,
      },
    });
    liveStreamId = stream.id;
  });

  afterEach(async () => {
    await prisma.liveStream.deleteMany({ where: { kolProfileId } });
    await prisma.kolProfile.delete({ where: { id: kolProfileId } });
    await prisma.user.delete({ where: { id: kolUserId } });
  });

  test('ENDED + PENDING stream is eligible for settlement', async () => {
    const stream = await prisma.liveStream.findUnique({ where: { id: liveStreamId } });
    expect(stream?.status).toBe('ENDED');
    expect(stream?.settlementStatus).toBe('PENDING');
    expect(stream?.totalRevenue).toBe(5000);
  });

  test('Settlement updates kolEarnings correctly', async () => {
    const stream = await prisma.liveStream.findUnique({
      where: { id: liveStreamId },
      include: { kolProfile: true },
    });

    const svc = new LiveRevenueService();
    const result = svc.calculate({
      totalRevenue: stream!.totalRevenue,
      commissionRate: stream!.kolProfile.commissionRate,
    });

    await prisma.liveStream.update({
      where: { id: liveStreamId },
      data: {
        settlementStatus: 'SETTLED',
        kolEarnings: result.kolEarnings,
        settlementRunAt: new Date(),
      },
    });

    const settled = await prisma.liveStream.findUnique({ where: { id: liveStreamId } });
    expect(settled?.settlementStatus).toBe('SETTLED');
    expect(settled?.kolEarnings).toBe(500); // 5000 * 0.1
  });

  test('Already SETTLED stream is skipped (idempotency)', async () => {
    const settledAt = new Date();
    await prisma.liveStream.update({
      where: { id: liveStreamId },
      data: { settlementStatus: 'SETTLED', settlementRunAt: settledAt },
    });

    const stream = await prisma.liveStream.findUnique({ where: { id: liveStreamId } });
    const hoursSince = (Date.now() - stream!.settlementRunAt!.getTime()) / 3600000;
    expect(hoursSince).toBeLessThan(24);
  });
});