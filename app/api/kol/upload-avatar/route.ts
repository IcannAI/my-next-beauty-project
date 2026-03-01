import { NextRequest, NextResponse } from 'next/server';
import { uploadKolAvatar } from '@/infrastructure/storage/s3-client';
import { requireKOL } from '@/infrastructure/auth/rbac';
import { getCurrentUser } from '@/infrastructure/auth/auth';
import { prisma } from '@/infrastructure/db/prisma';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: NextRequest) {
    const guard = await requireKOL();
    if (guard) return guard;

    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: '請選擇圖片' }, { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: '只支援 JPG、PNG、WebP 格式' },
                { status: 400 }
            );
        }

        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: '頭像大小不能超過 2MB' },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const url = await uploadKolAvatar(buffer, file.name, file.type);

        // 更新 KOL profile 的 avatarUrl
        await prisma.kolProfile.update({
            where: { userId: currentUser.id },
            data: { avatarUrl: url },
        });

        return NextResponse.json({ url });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        console.error('Avatar upload error:', error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
