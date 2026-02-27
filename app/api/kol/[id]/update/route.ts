import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';
import { requireKOL, requireAdmin } from '@/infrastructure/auth/rbac';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../auth.config";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const user = session.user as any;

  // Check if user is the owner or an admin
  const isOwner = user.id === id && user.role === 'KOL';
  const isAdmin = user.role === 'ADMIN';

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { bio } = await request.json();

    await prisma.kolProfile.update({
      where: { userId: id },
      data: { bio },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update KOL profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
