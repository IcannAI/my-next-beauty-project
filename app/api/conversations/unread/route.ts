import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/infrastructure/auth/auth';
import { prisma } from '@/infrastructure/db/prisma';

// GET /api/conversations/unread - 取得未讀訊息數
export async function GET(request: NextRequest) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const unreadCount = await prisma.message.count({
        where: {
            conversation: { participants: { some: { id: currentUser.id } } },
            senderId: { not: currentUser.id },
            read: false,
        },
    });

    return NextResponse.json({ unreadCount });
}
