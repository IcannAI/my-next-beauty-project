import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';
import { requireAdmin } from '@/infrastructure/auth/rbac';

export async function GET(request: NextRequest) {
    const guard = await requireAdmin();
    if (guard) return guard;

    try {
        // 偵測邏輯 1：同一用戶 10 分鐘內同一產品下單 2 次以上
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const recentOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: tenMinutesAgo },
                status: 'PENDING',
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                product: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        // 找出重複訂單（同用戶同產品）
        const duplicateMap = new Map<string, typeof recentOrders>();
        for (const order of recentOrders) {
            const key = `${order.userId}-${order.productId}`;
            if (!duplicateMap.has(key)) duplicateMap.set(key, []);
            duplicateMap.get(key)!.push(order);
        }

        const anomalies: any[] = [];
        for (const [, orders] of Array.from(duplicateMap)) {
            if (orders.length >= 2) {
                anomalies.push({
                    type: 'duplicate_order',
                    userId: orders[0].userId,
                    userName: orders[0].user.name,
                    userEmail: orders[0].user.email,
                    productId: orders[0].productId,
                    productName: orders[0].product?.name,
                    orderCount: orders.length,
                    orders: orders.map((o: any) => ({
                        id: o.id,
                        amount: o.totalAmount,
                        createdAt: o.createdAt,
                    })),
                });
            }
        }

        // 偵測邏輯 2：單一用戶 1 小時內下單超過 5 筆
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const bulkOrders = await prisma.order.groupBy({
            by: ['userId'],
            where: {
                createdAt: { gte: oneHourAgo },
                status: 'PENDING',
            },
            _count: { id: true },
            having: { id: { _count: { gte: 5 } } },
        });

        for (const bulk of bulkOrders) {
            const user = await prisma.user.findUnique({
                where: { id: bulk.userId },
                select: { name: true, email: true },
            });
            anomalies.push({
                type: 'bulk_order',
                userId: bulk.userId,
                userName: user?.name,
                userEmail: user?.email,
                orderCount: bulk._count.id,
                message: `1 小時內下單 ${bulk._count.id} 筆`,
            });
        }

        return NextResponse.json({ anomalies, total: anomalies.length });
    } catch (err) {
        console.error('Anomaly detection error:', err);
        return NextResponse.json({ error: '偵測失敗' }, { status: 500 });
    }
}
