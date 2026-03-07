// ✅ 21. 升級為模糊搜尋：name + description + bio 多欄位搜尋
// ✅ Input Validation — 改用 Zod

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import tracer from 'dd-trace';
import { prisma } from '@/infrastructure/db/prisma';

const SearchQuerySchema = z.object({
  q: z
    .string()
    .max(100, { message: '搜尋字串不得超過 100 字' })
    .optional()
    .default(''),
});

export async function GET(request: NextRequest) {
  const rootSpan = tracer.scope().active();

  // ✅ Zod 解析 query params
  const parsed = SearchQuerySchema.safeParse({
    q: request.nextUrl.searchParams.get('q') ?? '',
  });

  if (!parsed.success) {
    return NextResponse.json({ error: '搜尋參數有誤' }, { status: 400 });
  }

  const { q } = parsed.data;

  rootSpan?.addTags({
    'http.route': '/api/search/users',
    'http.method': request.method,
    'search.query': q.slice(0, 100),
  });

  try {
    // ✅ 21. 模糊搜尋：同時搜尋多個欄位，使用 OR 條件提升召回率
    const [kols, lives, users, products] = await Promise.all([
      prisma.kolProfile.findMany({
        where: q
          ? {
            OR: [
              { user: { name: { contains: q, mode: 'insensitive' } } },
              { bio: { contains: q, mode: 'insensitive' } },
            ],
          }
          : {},
        include: { user: true },
        take: 20,
      }),
      prisma.liveStream.findMany({
        where: q
          ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { kolProfile: { user: { name: { contains: q, mode: 'insensitive' } } } },
            ],
          }
          : {},
        include: { kolProfile: { include: { user: true } } },
        take: 20,
      }),
      prisma.user.findMany({
        where: q
          ? { name: { contains: q, mode: 'insensitive' } }
          : {},
        take: 20,
      }),
      prisma.product.findMany({
        where: q
          ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          }
          : {},
        include: { kolProfile: { include: { user: true } } },
        take: 20,
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