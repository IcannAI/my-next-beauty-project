import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { getCurrentUser } from '@/infrastructure/auth/auth';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { id } = await params;
        await pusherServer.trigger(
            `conversation-${id}`,
            'typing',
            {
                userId: currentUser.id,
                name: currentUser.name || '用戶',
            }
        );
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
