import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';
import { subDays } from 'date-fns';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get('x-test-mode') !== 'true')
    return new NextResponse('Not allowed', { status: 403 });
  const { id } = await params;
  const refund = await prisma.refundRequest.findUnique({ where: { id } });
  if (!refund) return new NextResponse('Not found', { status: 404 });

  await prisma.refundRequest.update({ where: { id }, data: { createdAt: subDays(new Date(), 8) } });
  return NextResponse.json({ success: true });
}
