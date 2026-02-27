import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';

  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: {
        kolProfile: {
          include: {
            user: true,
          },
        },
      },
      take: 20,
    });

    return NextResponse.json({ products });
  } catch (err) {
    console.error('Fetch products error:', err);
    return NextResponse.json({ error: '獲取產品失敗' }, { status: 500 });
  }
}
