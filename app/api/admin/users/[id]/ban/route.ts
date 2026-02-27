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
    const { banned } = await request.json();

    if (typeof banned !== 'boolean') {
      return NextResponse.json({ error: 'Invalid banned status' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { banned },
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Update ban status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
