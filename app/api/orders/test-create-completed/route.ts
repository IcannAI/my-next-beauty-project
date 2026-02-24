import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';

export async function POST(request: NextRequest) {
  if (request.headers.get('x-test-mode') !== 'true') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Ensure test user exists
  await prisma.user.upsert({
    where: { id: 'test-user-id' },
    update: {},
    create: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    },
  });

  const order = await prisma.order.create({
    data: {
      status: 'COMPLETED',
      userId: 'test-user-id',
      productId: 'test-product-id',
      totalAmount: 1000,
    },
  });

  return NextResponse.json({ id: order.id });
}
