import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/infrastructure/auth/auth';
import { prisma } from '@/infrastructure/db/prisma';

// GET /api/conversations - 取得我的所有對話
export async function GET(request: NextRequest) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
        where: { participants: { some: { id: currentUser.id } } },
        include: {
            participants: { select: { id: true, name: true, email: true } },
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
            },
        },
        orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(conversations);
}

// POST /api/conversations - 建立或取得對話
export async function POST(request: NextRequest) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId } = body as { targetUserId: string };

    if (!targetUserId) {
        return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    // 先查詢是否已存在對話
    const existing = await prisma.conversation.findFirst({
        where: {
            AND: [
                { participants: { some: { id: currentUser.id } } },
                { participants: { some: { id: targetUserId } } },
            ],
        },
        include: { participants: true },
    });

    if (existing) {
        return NextResponse.json({ conversationId: existing.id, conversation: existing });
    }

    // 建立新對話
    const conversation = await prisma.conversation.create({
        data: {
            participants: {
                connect: [{ id: currentUser.id }, { id: targetUserId }],
            },
        },
        include: { participants: true },
    });

    return NextResponse.json({ conversationId: conversation.id, conversation }, { status: 201 });
}
