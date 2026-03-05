import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const { name, email, password, role } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: '請填寫所有欄位' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: '密碼至少 6 個字元' }, { status: 400 });
        }

        const allowedRoles = ['USER', 'KOL'];
        const userRole = allowedRoles.includes(role) ? role : 'USER';

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: '此 Email 已被註冊' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword, role: userRole },
        });

        if (userRole === 'KOL') {
            await prisma.kolProfile.create({
                data: { userId: user.id, bio: null, commissionRate: 0.1 },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Register error:', error);
        return NextResponse.json({ error: '註冊失敗' }, { status: 500 });
    }
}
