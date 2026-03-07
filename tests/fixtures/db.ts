// tests/fixtures/db.ts
import { prisma } from '@/infrastructure/db/prisma';

export async function getRefundRequest(id: string) {
  return prisma.refundRequest.findUnique({ where: { id } });
}

export async function createTestUser(overrides?: {
  email?: string; name?: string; role?: string;
}) {
  const ts = Date.now();
  return prisma.user.create({
    data: {
      email:    overrides?.email ?? `e2e-${ts}@test.com`,
      name:     overrides?.name  ?? `E2E User ${ts}`,
      role:     overrides?.role  ?? 'USER',
      password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oq5V5YXQG',
    },
  });
}

export async function createTestKOLProfile(userId: string) {
  return prisma.kolProfile.upsert({
    where:  { userId },
    create: { userId, commissionRate: 0.1 },
    update: {},
  });
}

export async function createTestProduct(kolProfileId: string, overrides?: {
  name?: string; price?: number; stock?: number;
}) {
  return prisma.product.create({
    data: {
      name:        overrides?.name  ?? 'E2E Product',
      price:       overrides?.price ?? 999,
      stock:       overrides?.stock ?? 100,
      kolProfileId,
    },
  });
}

export async function createTestOrder(userId: string, productId: string, overrides?: {
  status?: string; totalAmount?: number; liveStreamId?: string;
}) {
  return prisma.order.create({
    data: {
      userId,
      productId,
      status:      overrides?.status      ?? 'PENDING',
      totalAmount: overrides?.totalAmount ?? 999,
      liveStreamId: overrides?.liveStreamId,
    },
  });
}

export async function createTestLiveStream(kolProfileId: string, overrides?: {
  title?: string; status?: string;
}) {
  return prisma.liveStream.create({
    data: {
      kolProfileId,
      title:  overrides?.title  ?? 'E2E Live Stream',
      status: overrides?.status ?? 'LIVE',
    },
  });
}

export async function cleanupUser(userId: string): Promise<void> {
  await prisma.notification.deleteMany({ where: { userId } });
  await prisma.favorite.deleteMany({ where: { userId } });
  await prisma.review.deleteMany({ where: { userId } });
  await prisma.refundRequest.deleteMany({ where: { userId } });
  await prisma.order.deleteMany({ where: { userId } });
  const profile = await prisma.kolProfile.findUnique({ where: { userId } });
  if (profile) {
    await prisma.order.deleteMany({ where: { liveStream: { kolProfileId: profile.id } } });
    await prisma.liveStream.deleteMany({ where: { kolProfileId: profile.id } });
    await prisma.order.deleteMany({ where: { product: { kolProfileId: profile.id } } });
    await prisma.product.deleteMany({ where: { kolProfileId: profile.id } });
    await prisma.kolProfile.delete({ where: { userId } });
  }
  await prisma.user.delete({ where: { id: userId } });
}

export async function cleanupByEmail(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) await cleanupUser(user.id);
}
