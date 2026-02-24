import { NextRequest, NextResponse } from 'next/server';
import tracer from 'dd-trace';
import { prisma } from '@/infrastructure/db/prisma';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';

  const rootSpan = tracer.scope().active();
  rootSpan?.addTags({
    'http.route': '/api/search/users',
    'http.method': request.method,
    'search.query': q.slice(0, 100),
  });

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { kolProfile: { bio: { contains: q, mode: 'insensitive' } } },
        ],
      },
      take: 20,
    });

    const usersWithUrl = users.map(user => ({
      ...user,
      url: `/kol/${user.id}`
    }));

    return NextResponse.json(usersWithUrl);
  } catch (err) {
    const error = err as Error;
    rootSpan?.setTag('error.type', error.name);
    rootSpan?.setTag('error.message', error.message);
    return NextResponse.json({ error: '搜尋失敗' }, { status: 500 });
  }
}
