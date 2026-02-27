import { NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';
import { requireAdmin } from '@/infrastructure/auth/rbac';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { id } = await params;
    const { action } = await request.json();

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    const result = await prisma.$transaction(async (tx) => {
      const refundRequest = await tx.refundRequest.update({
        where: { id },
        data: { status },
        include: { order: true },
      });

      if (action === 'APPROVE') {
        await tx.order.update({
          where: { id: refundRequest.orderId },
          data: { status: 'REFUNDED' },
        });
      }

      return refundRequest;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Refund review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
