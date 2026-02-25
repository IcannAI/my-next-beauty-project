import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';
import { getCurrentUser } from '@/infrastructure/auth/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { rating, comment } = body;

  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: '評分必須在 1 到 5 之間' }, { status: 400 });
  }

  try {
    const refund = await prisma.refundRequest.findUnique({
      where: { id },
    });

    if (!refund) {
      return NextResponse.json({ error: '找不到退款申請' }, { status: 404 });
    }

    if (refund.userId !== user.id) {
      return NextResponse.json({ error: '無權限操作此退款申請' }, { status: 403 });
    }

    if (refund.feedbackSubmitted) {
      return NextResponse.json({ error: '您已經提交過評價' }, { status: 400 });
    }

    await prisma.refundRequest.update({
      where: { id },
      data: {
        feedbackRating: rating,
        feedbackComment: comment || '',
        feedbackSubmitted: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json({ error: '提交失敗，請稍後再試' }, { status: 500 });
  }
}
