import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';
import { requireAdmin } from '@/infrastructure/auth/rbac';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await requireAdmin();
    if (guard) return guard;

    try {
        const { id } = await params;
        const stream = await prisma.liveStream.findUnique({ where: { id } });
        if (!stream) {
            return NextResponse.json({ error: '直播不存在' }, { status: 404 });
        }
        if (stream.status === 'LIVE') {
            return NextResponse.json({ error: '無法下架進行中的直播' }, { status: 400 });
        }
        await prisma.liveStream.update({
            where: { id },
            data: { status: 'ARCHIVED' },
        });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Archive live stream error:', err);
        return NextResponse.json({ error: '下架失敗' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await requireAdmin();
    if (guard) return guard;

    try {
        const { id } = await params;
        await prisma.liveStream.update({
            where: { id },
            data: { status: 'ENDED' },
        });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: '還原失敗' }, { status: 500 });
    }
}
