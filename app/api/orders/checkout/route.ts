import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';
import { getCurrentUser } from '@/infrastructure/auth/auth';
import { requireUser } from '@/infrastructure/auth/rbac';

interface CheckoutItem {
    productId: string;
    quantity: number;
    price: number;
}

export async function POST(request: NextRequest) {
    const guard = await requireUser();
    if (guard) return guard;

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 });

    try {
        const { items } = await request.json() as { items: CheckoutItem[] };

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: '購物車是空的' }, { status: 400 });
        }
        if (items.length > 20) {
            return NextResponse.json({ error: '單次最多購買 20 項商品' }, { status: 400 });
        }

        const productIds = items.map(i => i.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
        });

        // 驗證每個產品
        for (const item of items) {
            const product = products.find(p => p.id === item.productId);
            if (!product) {
                return NextResponse.json(
                    { error: `產品不存在：${item.productId}` },
                    { status: 400 }
                );
            }
            if (product.stock < item.quantity) {
                return NextResponse.json(
                    { error: `${product.name} 庫存不足（剩餘 ${product.stock} 件）` },
                    { status: 400 }
                );
            }
            // 驗證價格是否正確（防止前端篡改）
            if (Math.abs(product.price - item.price) > 0.01) {
                return NextResponse.json(
                    { error: `${product.name} 價格有誤，請重新加入購物車` },
                    { status: 400 }
                );
            }
        }

        // 建立訂單（transaction）
        const orders = await prisma.$transaction(async tx => {
            const created = [];
            for (const item of items) {
                const product = products.find(p => p.id === item.productId)!;
                const totalAmount = product.price * item.quantity;

                // 扣除庫存
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                });

                // 建立訂單
                const order = await tx.order.create({
                    data: {
                        userId: user.id,
                        productId: item.productId,
                        totalAmount,
                        status: 'PENDING',
                    },
                });
                created.push(order);
            }
            return created;
        });

        return NextResponse.json({
            success: true,
            orderCount: orders.length,
            message: `成功建立 ${orders.length} 筆訂單`,
        });
    } catch (err) {
        console.error('Checkout error:', err);
        return NextResponse.json({ error: '結帳失敗，請重試' }, { status: 500 });
    }
}
