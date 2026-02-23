import { NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';
import { subDays } from 'date-fns';

export const dynamic = 'force-dynamic';
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`)
    return new NextResponse('Unauthorized', { status: 401 });

  const sevenDaysAgo = subDays(new Date(), 7);
  let remindedCount = 0, errorCount = 0;
  const errors: string[] = [];
  let skip = 0;

  while (true) {
    const pending = await prisma.refundRequest.findMany({
      where: { status: 'APPROVED', feedbackSubmitted: false, feedbackReminderSent: false, createdAt: { lte: sevenDaysAgo } },
      include: { order: { select: { id: true, user: { select: { id: true } } } } },
      take: 100, skip,
    });
    if (pending.length === 0) break;
    for (const refund of pending) {
      try {
        await prisma.notification.create({ data: { userId: refund.order.user.id, title: '退款滿意度調查提醒', message: `訂單 #${refund.order.id} 退款已通過超過 7 天，請填寫滿意度調查。`, type: 'refund_feedback_reminder' } });
        await prisma.refundRequest.update({ where: { id: refund.id }, data: { feedbackReminderSent: true } });
        remindedCount++;
      } catch (err: any) { errorCount++; errors.push(`refund ${refund.id}: ${err.message}`); }
    }
    skip += 100;
  }
  return NextResponse.json({ success: true, reminded: remindedCount, errors: errorCount });
}
