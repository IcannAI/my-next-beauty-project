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
    const [kols, lives, users, products] = await Promise.all([
      prisma.kolProfile.findMany({
        where: q ? { user: { name: { contains: q, mode: 'insensitive' } } } : {},
        include: { user: true },
      }),
      prisma.liveStream.findMany({
        where: q ? { title: { contains: q, mode: 'insensitive' } } : {},
        include: { kolProfile: { include: { user: true } } },
      }),
      prisma.user.findMany({
        where: q ? { name: { contains: q, mode: 'insensitive' } } : {},
      }),
      prisma.product.findMany({
        where: q ? { name: { contains: q, mode: 'insensitive' } } : {},
        include: { kolProfile: { include: { user: true } } },
      }),
    ]);

    const results = {
      kols: kols.map(k => ({
        id: k.id,
        name: k.user.name,
        bio: k.bio,
        userId: k.userId,
        avatarUrl: k.avatarUrl,
      })),
      lives: lives.map(l => ({
        id: l.id,
        title: l.title,
        status: l.status,
        kolName: l.kolProfile.user.name,
      })),
      articles: [], // Placeholder for future expansion
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
      })),
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        kolName: p.kolProfile.user.name,
        imageUrl: p.imageUrl,
        avgRating: p.avgRating,
        reviewCount: p.reviewCount,
      })),
    };

    return NextResponse.json(results);
  } catch (err) {
    const error = err as Error;
    rootSpan?.setTag('error.type', error.name);
    rootSpan?.setTag('error.message', error.message);
    return NextResponse.json({ error: '搜尋失敗' }, { status: 500 });
  }
}
