import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';
import { getCurrentUser } from '@/infrastructure/auth/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: productId } = await params;
        const { searchParams } = new URL(request.url);
        const sort = searchParams.get('sort') || 'latest';
        const filterRating = searchParams.get('rating');
        const page = parseInt(searchParams.get('page') || '0');

        const orderBy = sort === 'latest'
            ? { createdAt: 'desc' as const }
            : sort === 'highest'
                ? { rating: 'desc' as const }
                : { rating: 'asc' as const };

        const where = {
            productId,
            ...(filterRating ? { rating: parseInt(filterRating) } : {}),
        };

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true } },
                },
                orderBy,
                take: 10,
                skip: page * 10,
            }),
            prisma.review.count({ where }),
        ]);

        return NextResponse.json({ reviews, total, page });
    } catch {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: productId } = await params;
        const body = await request.json();
        const { rating, comment } = body;

        // 驗證評分範圍
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: '評分需為 1-5 的整數' },
                { status: 400 }
            );
        }

        // 取得產品資訊
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { kolProfile: true },
        });

        if (!product) {
            return NextResponse.json({ error: '產品不存在' }, { status: 404 });
        }

        // 防止 KOL 評自己的產品
        if (product.kolProfile.userId === currentUser.id) {
            return NextResponse.json(
                { error: '不能評價自己的產品' },
                { status: 403 }
            );
        }

        // 驗證購買紀錄
        const order = await prisma.order.findFirst({
            where: {
                userId: currentUser.id,
                productId,
                status: { in: ['COMPLETED', 'DELIVERED', 'PENDING'] },
            },
        });

        if (!order) {
            return NextResponse.json(
                { error: '需要購買紀錄才能評分' },
                { status: 403 }
            );
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

        let review;
        if (existing) {
            // 更新現有評分
            review = await prisma.review.update({
                where: {
                    userId_productId: {
                        userId: currentUser.id,
                        productId,
                    },
                },
                data: {
                    rating,
                    comment: comment || null,
                },
                include: {
                    user: { select: { id: true, name: true } },
                },
            });
        } else {
            // 新增評分
            review = await prisma.review.create({
                data: {
                    rating,
                    comment: comment || null,
                    userId: currentUser.id,
                    productId,
                    orderId: order.id,
                },
                include: {
                    user: { select: { id: true, name: true } },
                },
            });
        }

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

        return NextResponse.json({
            review,
            isUpdate: !!existing,
        });
    } catch {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
