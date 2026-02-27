import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';
import { getCurrentUser } from '@/infrastructure/auth/auth';
import { requireKOL } from '@/infrastructure/auth/rbac';

export async function POST(request: NextRequest) {
  const guard = await requireKOL();
  if (guard) return guard;

  const user = await getCurrentUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const { title } = await request.json();

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const kolProfile = await prisma.kolProfile.findUnique({
    where: { userId: user.id },
  });

  if (!kolProfile) {
    return NextResponse.json({ error: 'User is not a KOL' }, { status: 403 });
  }

  const liveStream = await prisma.liveStream.create({
    data: {
      title,
      kolProfileId: kolProfile.id,
      status: 'LIVE',
      startedAt: new Date(),
    },
  });

  return NextResponse.json({ id: liveStream.id });
}
