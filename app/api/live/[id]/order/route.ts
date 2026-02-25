import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';
import { getCurrentUser } from '@/infrastructure/auth/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { productId, totalAmount } = body;

    if (!productId || typeof totalAmount !== 'number') {
      return NextResponse.json({ error: '參數錯誤' }, { status: 400 });
    }

    const orderId = await prisma.$transaction(async (tx) => {
      // 1. 建立訂單
      const order = await tx.order.create({
        data: {
          userId: user.id,
          liveStreamId: id,
          productId,
          totalAmount,
          status: 'PENDING',
        },
      });

      // 2. 建立通知
      await tx.notification.create({
        data: {
          userId: user.id,
          title: '訂單成立',
          message: `您已在直播中下單 (訂單 ID: ${order.id})，請盡快完成付款。`,
          type: 'order_created',
        },
      });

      return order.id;
    });

    return NextResponse.json({ orderId });
  } catch (error) {
    console.error('Live Order Error:', error);
    return NextResponse.json({ error: '下單失敗，請稍後再試' }, { status: 500 });
  }
}
