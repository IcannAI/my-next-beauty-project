import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';
import { requireAdmin } from '@/infrastructure/auth/rbac';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await requireAdmin();
    if (guard) return guard;

    try {
        const { id } = await params;
        const { reason } = await request.json().catch(() => ({ reason: '管理員取消' }));

        const order = await prisma.order.findUnique({
            where: { id },
            include: { product: true },
        });
        if (!order) {
            return NextResponse.json({ error: '訂單不存在' }, { status: 404 });
        }
        if (order.status === 'CANCELLED') {
            return NextResponse.json({ error: '訂單已取消' }, { status: 400 });
        }

        await prisma.$transaction(async tx => {
            // 1. 更新訂單狀態
            await tx.order.update({
                where: { id },
                data: { status: 'CANCELLED' },
            });

            // 2. 若有庫存記錄則還原（PENDING 訂單扣過庫存）
            if (order.productId && order.status === 'PENDING') {
                await tx.product.update({
                    where: { id: order.productId },
                    data: { stock: { increment: 1 } },
                });
            }

            // 3. 建立通知給用戶
            await tx.notification.create({
                data: {
                    userId: order.userId,
                    title: '訂單已取消',
                    message: `訂單 #${order.id.slice(-8)} 已由管理員取消。原因：${reason || '管理員取消'}`,
                    type: 'order_cancelled',
                },
            });
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Cancel order error:', err);
        return NextResponse.json({ error: '取消訂單失敗' }, { status: 500 });
    }
}
