import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        kolProfile: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: '產品不存在' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (err) {
    console.error('Fetch product detail error:', err);
    return NextResponse.json({ error: '獲取產品失敗' }, { status: 500 });
  }
}
