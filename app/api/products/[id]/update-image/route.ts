import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';
import { getCurrentUser } from '@/infrastructure/auth/auth';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: productId } = await params;
        const { imageUrl } = await request.json();

        if (!imageUrl || typeof imageUrl !== 'string') {
            return NextResponse.json({ error: 'Invalid imageUrl' }, { status: 400 });
        }

        // 確認產品屬於當前 KOL
        const product = await prisma.product.findFirst({
            where: {
                id: productId,
                kolProfile: { userId: currentUser.id },
            },
        });

        if (!product && currentUser.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const updated = await prisma.product.update({
            where: { id: productId },
            data: { imageUrl },
        });

        return NextResponse.json({ product: updated });
    } catch {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
