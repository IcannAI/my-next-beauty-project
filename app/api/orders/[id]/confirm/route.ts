import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';
import { getCurrentUser } from '@/infrastructure/auth/auth';
import { requireUser } from '@/infrastructure/auth/rbac';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await requireUser();
    if (guard) return guard;

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 });

    try {
        const { id } = await params;
        const order = await prisma.order.findUnique({ where: { id } });

        if (!order) {
            return NextResponse.json({ error: '訂單不存在' }, { status: 404 });
        }
        if (order.userId !== user.id && user.role !== 'ADMIN') {
            return NextResponse.json({ error: '無權限操作此訂單' }, { status: 403 });
        }
        if (order.status !== 'PENDING') {
            return NextResponse.json(
                { error: `訂單狀態為 ${order.status}，無法確認收貨` },
                { status: 400 }
            );
        }

        const updated = await prisma.order.update({
            where: { id },
            data: { status: 'COMPLETED' },
        });

        return NextResponse.json({ success: true, order: updated });
    } catch (err) {
        console.error('Confirm order error:', err);
        return NextResponse.json({ error: '確認收貨失敗' }, { status: 500 });
    }
}
