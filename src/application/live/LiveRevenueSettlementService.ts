// src/application/live/LiveRevenueSettlementService.ts

import { prisma } from '@/infrastructure/db/prisma';
import { LiveRevenueService } from '@/domain/live/LiveRevenueService';
import { logger } from '@/infrastructure/observability/logger';

const domainService = new LiveRevenueService();

export async function settleEndedLiveStreams(): Promise<{
  settled: string[];
  skipped: string[];
  failed: string[];
}> {
  const settled: string[] = [];
  const skipped: string[] = [];
  const failed: string[] = [];

  // 只撈 ENDED 且尚未 SETTLED 的直播
  const streams = await prisma.liveStream.findMany({
    where: {
      status: 'ENDED',
      settlementStatus: 'PENDING',
    },
    include: {
      kolProfile: true,
      orders: { where: { status: 'COMPLETED' } },
    },
  });

  for (const stream of streams) {
    // 冪等性保護：若 24 小時內已執行過，跳過
    if (stream.settlementRunAt) {
      const hoursSince = (Date.now() - stream.settlementRunAt.getTime()) / 3600000;
      if (hoursSince < 24) {
        skipped.push(stream.id);
        continue;
      }
    }

    try {
      // 1. 標記為 PROCESSING（防止並行重複執行）
      await prisma.liveStream.update({
        where: { id: stream.id },
        data: { settlementStatus: 'PROCESSING', settlementRunAt: new Date() },
      });

      // 2. 計算分潤
      const totalRevenue = stream.orders.reduce((sum, o) => sum + o.totalAmount, 0);
      const result = domainService.calculate({
        liveStreamId: stream.id,
        totalRevenue,
        commissionRate: stream.kolProfile.commissionRate,
      });

      // 3. 寫入結果
      await prisma.liveStream.update({
        where: { id: stream.id },
        data: {
          settlementStatus: 'SETTLED',
          totalRevenue: result.kolEarnings + result.platformEarnings,
          kolEarnings: result.kolEarnings,
        },
      });
      settled.push(stream.id);
      logger.info({ liveStreamId: stream.id, ...result }, '分潤結算完成');
    } catch (err) {
      // 回滾為 FAILED，允許下次重試
      await prisma.liveStream.update({
        where: { id: stream.id },
        data: { settlementStatus: 'FAILED' },
      }).catch(() => {});
      failed.push(stream.id);
      logger.error({ liveStreamId: stream.id, err }, '分潤結算失敗');
    }
  }

  return { settled, skipped, failed };
}
