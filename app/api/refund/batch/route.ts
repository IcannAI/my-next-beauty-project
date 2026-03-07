// ✅ 13. Commission Clawback — 退款時同步扣回 kolEarnings
// ✅ 18. Real-time Refund Status — 退款完成後 Pusher 推播
// ✅ Input Validation — 改用 Zod

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/infrastructure/db/prisma';
import { getCurrentUser } from '@/infrastructure/auth/auth';
import { requireUser } from '@/infrastructure/auth/rbac';
import { pusherServer } from '@/lib/pusher';

// ✅ Zod schema 取代手動驗證
const BatchRefundSchema = z.object({
  orderIds: z
    .array(z.string().cuid({ message: '無效的訂單 ID 格式' }))
    .min(1, { message: '請至少選擇一筆訂單' })
    .max(10, { message: '單次批量退款最多 10 筆' }),
  reason: z
    .string()
    .min(5, { message: '退款理由至少 5 個字' })
    .max(500, { message: '退款理由不得超過 500 字' }),
  evidenceUrls: z
    .array(z.string().url({ message: '無效的佐證資料網址' }))
    .max(5, { message: '佐證資料最多 5 個檔案' })
    .optional()
    .default([]),
});

export async function POST(request: NextRequest) {
  const guard = await requireUser();
  if (guard) return guard;

  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  // ✅ Zod 解析並驗證 body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '無效的請求格式' }, { status: 400 });
  }

  const parsed = BatchRefundSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? '請求資料有誤';
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { orderIds, reason, evidenceUrls } = parsed.data;

  // 查詢符合退款條件的訂單，同時取得 liveStreamId 以利 Clawback
  const orders = await prisma.order.findMany({
    where: {
      id: { in: orderIds },
      userId: user.id,
      status: 'COMPLETED',
      refundRequest: null,
    },
    include: {
      product: {
        include: {
          kolProfile: true,
        },
      },
      liveStream: true,
    },
  });

  if (orders.length !== orderIds.length) {
    const missing = orderIds.filter((id: string) => !orders.some(o => o.id === id));
    return NextResponse.json(
      {
        error: '部分訂單無法退款',
        details: `以下訂單不符合退款條件：${missing.join(', ')}`,
      },
      { status: 400 }
    );
  }

  const createdRefunds: any[] = [];

  try {
    await prisma.$transaction(async tx => {
      for (const order of orders) {
        // ✅ 建立退款申請
        const refund = await tx.refundRequest.create({
          data: {
            orderId: order.id,
            userId: user.id,
            reason: reason.trim(),
            status: 'PENDING',
            evidenceUrls,
          },
        });
        createdRefunds.push(refund);

        // ✅ 13. Commission Clawback：退款時扣回對應 LiveStream 的 kolEarnings
        if (order.liveStreamId && order.product?.kolProfile) {
          const commissionRate = order.product.kolProfile.commissionRate;
          const refundAmount = order.totalAmount;
          const clawback = Math.round(refundAmount * commissionRate * 100) / 100;

          await tx.liveStream.update({
            where: { id: order.liveStreamId },
            data: {
              kolEarnings: { decrement: clawback },
              // totalRevenue 也同步扣減，保持數字一致性
              totalRevenue: { decrement: refundAmount },
            },
          });
        }
      }
    });

    // ✅ 18. Pusher 推播：通知該用戶退款申請已建立
    try {
      await pusherServer.trigger(
        `private-user-${user.id}`,
        'refund:created',
        {
          count: createdRefunds.length,
          refundIds: createdRefunds.map(r => r.id),
          message: `已成功提交 ${createdRefunds.length} 筆批量退款申請，我們將盡快處理。`,
          createdAt: new Date().toISOString(),
        }
      );
    } catch (pusherError) {
      // Pusher 失敗不影響退款主流程，只記錄 log
      console.warn('Pusher 推播失敗（退款仍成功）:', pusherError);
    }

    return NextResponse.json({
      success: true,
      count: createdRefunds.length,
      message: `已成功提交 ${createdRefunds.length} 筆批量退款申請`,
      refunds: createdRefunds.map(r => r.id),
    });
  } catch (error) {
    console.error('批量退款事務失敗:', error);
    return NextResponse.json({ error: '批量退款處理失敗，請稍後再試' }, { status: 500 });
  }
}