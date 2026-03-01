import { NextRequest, NextResponse } from 'next/server';
import { uploadProductImage } from '@/infrastructure/storage/s3-client';
import { requireKOL } from '@/infrastructure/auth/rbac';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
    const guard = await requireKOL();
    if (guard) return guard;

    try {
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
                { error: '檔案大小不能超過 5MB' },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const url = await uploadProductImage(buffer, file.name, file.type);

        return NextResponse.json({ url });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        console.error('Product image upload error:', error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
