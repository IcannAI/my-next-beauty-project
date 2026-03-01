import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: productId } = await params;

        const [stats, distribution] = await Promise.all([
            prisma.review.aggregate({
                where: { productId },
                _avg: { rating: true },
                _count: { rating: true },
            }),
            prisma.review.groupBy({
                by: ['rating'],
                where: { productId },
                _count: { rating: true },
                orderBy: { rating: 'desc' },
            }),
        ]);

        const total = stats._count.rating;
        const ratingMap = Object.fromEntries(
            distribution.map(d => [d.rating, d._count.rating])
        );

        const ratingDistribution = [5, 4, 3, 2, 1].map(r => ({
            rating: r,
            count: ratingMap[r] || 0,
            percent: total > 0
                ? Math.round(((ratingMap[r] || 0) / total) * 100)
                : 0,
        }));

        return NextResponse.json({
            avgRating: Math.round((stats._avg.rating || 0) * 10) / 10,
            totalCount: total,
            ratingDistribution,
        });
    } catch {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
