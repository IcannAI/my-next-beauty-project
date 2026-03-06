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
        const { commissionRate } = await request.json();

        if (typeof commissionRate !== 'number' ||
            commissionRate < 0 || commissionRate > 1) {
            return NextResponse.json(
                { error: '分潤比例必須在 0~1 之間（例如 0.1 = 10%）' },
                { status: 400 }
            );
        }

        const profile = await prisma.kolProfile.findUnique({ where: { id } });
        if (!profile) {
            return NextResponse.json({ error: 'KOL 不存在' }, { status: 404 });
        }

        const updated = await prisma.kolProfile.update({
            where: { id },
            data: { commissionRate },
        });

        return NextResponse.json({ success: true, commissionRate: updated.commissionRate });
    } catch (err) {
        console.error('Update commission rate error:', err);
        return NextResponse.json({ error: '更新失敗' }, { status: 500 });
    }
}
