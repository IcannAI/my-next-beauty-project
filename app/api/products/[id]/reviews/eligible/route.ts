import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';
import { getCurrentUser } from '@/infrastructure/auth/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ eligible: false, reason: 'not_logged_in' });
        }

        const { id: productId } = await params;

        // 取得產品
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { kolProfile: true },
        });

        if (!product) {
            return NextResponse.json({ eligible: false, reason: 'product_not_found' });
        }

        // KOL 自己的產品
        if (product.kolProfile.userId === currentUser.id) {
            return NextResponse.json({ eligible: false, reason: 'own_product' });
        }

        // 檢查購買紀錄
        const order = await prisma.order.findFirst({
            where: {
                userId: currentUser.id,
                productId,
                status: { in: ['COMPLETED', 'DELIVERED', 'PENDING'] },
            },
        });

        if (!order) {
            return NextResponse.json({ eligible: false, reason: 'no_purchase' });
        }

        // 檢查是否已評分
        const existing = await prisma.review.findUnique({
            where: {
                userId_productId: {
                    userId: currentUser.id,
                    productId,
                },
            },
        });

        return NextResponse.json({
            eligible: true,
            hasReviewed: !!existing,
            existingReview: existing || null,
        });
    } catch {
        return NextResponse.json({ eligible: false, reason: 'error' });
    }
}
