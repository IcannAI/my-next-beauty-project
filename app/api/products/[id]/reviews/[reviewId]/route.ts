import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';
import { getCurrentUser } from '@/infrastructure/auth/auth';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: productId, reviewId } = await params;

        // 確認評分屬於當前用戶
        const review = await prisma.review.findFirst({
            where: {
                id: reviewId,
                userId: currentUser.id,
                productId,
            },
        });

        if (!review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        await prisma.review.delete({ where: { id: reviewId } });

        // 更新產品平均評分
        const stats = await prisma.review.aggregate({
            where: { productId },
            _avg: { rating: true },
            _count: { rating: true },
        });

        await prisma.product.update({
            where: { id: productId },
            data: {
                avgRating: Math.round((stats._avg.rating || 0) * 10) / 10,
                reviewCount: stats._count.rating,
            },
        });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
