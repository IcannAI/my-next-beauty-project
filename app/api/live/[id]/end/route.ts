import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';
import { getCurrentUser } from '@/infrastructure/auth/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const kolProfile = await prisma.kolProfile.findUnique({
    where: { userId: user.id },
  });

  if (!kolProfile) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const liveStream = await prisma.liveStream.findUnique({
    where: { id },
  });

  if (!liveStream || liveStream.kolProfileId !== kolProfile.id) {
    return new NextResponse('Not found or unauthorized', { status: 404 });
  }

  await prisma.liveStream.update({
    where: { id },
    data: {
      status: 'ENDED',
      endedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
