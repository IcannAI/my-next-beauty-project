// src/app/api/cron/settle-live-revenue/route.ts

import { NextResponse } from 'next/server';
import { settleEndedLiveStreams } from '@/application/live/LiveRevenueSettlementService';
import { logger } from '@/infrastructure/observability/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 分鐘 timeout

export async function GET(request: Request) {
  const CRON_SECRET = process.env.CRON_SECRET;
  if (request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const startTime = Date.now();

  try {
    const result = await settleEndedLiveStreams();
    const duration = Date.now() - startTime;
    logger.info({ ...result, durationMs: duration }, 'Cron: 分潤結算完成');
    return NextResponse.json({
      success: true,
      ...result,
      durationMs: duration,
    });
  } catch (err) {
    logger.error({ err }, 'Cron: 分潤結算失敗');
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
