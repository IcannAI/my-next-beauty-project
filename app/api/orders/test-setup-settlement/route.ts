import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';

export async function POST(request: NextRequest) {
  if (request.headers.get('x-test-mode') !== 'true') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const { liveId, orders } = await request.json();

  if (!liveId || !orders || !Array.isArray(orders)) {
    return new NextResponse('Invalid data', { status: 400 });
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

  const createdOrders = [];
  for (const orderData of orders) {
    const order = await prisma.order.create({
      data: {
        status: orderData.status || 'COMPLETED',
        userId: 'test-user-id',
        productId: 'test-product-id',
        totalAmount: orderData.amount || 1000,
        liveStreamId: liveId,
      },
    });
    createdOrders.push(order);
  }

  return NextResponse.json({ success: true, count: createdOrders.length });
}
