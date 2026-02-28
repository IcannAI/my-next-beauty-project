import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/infrastructure/auth/auth';
import { prisma } from '@/infrastructure/db/prisma';
import { pusherServer } from '@/lib/pusher';

// GET /api/conversations/[id]/messages - 取得對話訊息（支援分頁）
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // 確認是對話參與者
    const conversation = await prisma.conversation.findFirst({
        where: {
            id,
            participants: { some: { id: currentUser.id } },
        },
    });

    if (!conversation) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');

    // 取得訊息
    const messages = await prisma.message.findMany({
        where: { conversationId: id },
        include: { sender: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: page * 50,
    });

    // 批量標記已讀
    await prisma.message.updateMany({
        where: {
            conversationId: id,
            senderId: { not: currentUser.id },
            read: false,
        },
        data: { read: true },
    });

    // 通知發送者訊息已被讀取
    await pusherServer.trigger(
        `conversation-${id}`,
        'messages-read',
        { readBy: currentUser.id }
    );

    return NextResponse.json(messages);
}

// POST /api/conversations/[id]/messages - 發送訊息
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // 確認是對話參與者
    const conversation = await prisma.conversation.findFirst({
        where: {
            id,
            participants: { some: { id: currentUser.id } },
        },
        include: { participants: { select: { id: true } } }
    });

    if (!conversation) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { content } = body as { content: string };

    if (!content || !content.trim()) {
        return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    // 建立訊息
    const message = await prisma.message.create({
        data: {
            content,
            senderId: currentUser.id,
            conversationId: id,
        },
        include: { sender: { select: { id: true, name: true } } },
    });

    // 更新對話 updatedAt
    await prisma.conversation.update({
        where: { id },
        data: { updatedAt: new Date() },
    });

    // 建立訊息後觸發 Pusher
    await pusherServer.trigger(
        `conversation-${id}`,
        'new-message',
        {
            id: message.id,
            content: message.content,
            senderId: message.senderId,
            senderName: message.sender.name,
            createdAt: message.createdAt,
            read: message.read,
        }
    );

    // 通知每個其他參與者有新未讀訊息
    for (const participant of conversation.participants) {
        if (participant.id !== currentUser.id) {
            await pusherServer.trigger(
                `user-${participant.id}`,
                'new-unread',
                {
                    conversationId: id,
                    senderName: currentUser.name || '用戶',
                    content: message.content,
                }
            );
        }
    }

    return NextResponse.json(message, { status: 201 });
}
