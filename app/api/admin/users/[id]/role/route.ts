import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';
import { requireAdmin } from '@/infrastructure/auth/rbac';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { id } = await params;
    const { role } = await request.json();

    if (!['USER', 'KOL', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
    });

    // If role is updated to KOL, ensure they have a KOL profile
    if (role === 'KOL') {
      await prisma.kolProfile.upsert({
        where: { userId: id },
        update: {},
        create: { userId: id },
      });
    }

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Update role error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
