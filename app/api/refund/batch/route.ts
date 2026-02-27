import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';
import { getCurrentUser } from '@/infrastructure/auth/auth';
import { requireUser } from '@/infrastructure/auth/rbac';

export async function POST(request: NextRequest) {
  const guard = await requireUser();
  if (guard) return guard;

  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  let body;
  try { body = await request.json() }
  catch { return NextResponse.json({ error: '無效的請求格式' }, { status: 400 }) }

    const { orderIds, reason, evidenceUrls } = body;
    if (!Array.isArray(orderIds) || orderIds.length === 0)
      return NextResponse.json({ error: '請至少選擇一筆訂單' }, { status: 400 });
    if (orderIds.length > 10)
      return NextResponse.json({ error: '單次批量退款最多 10 筆' }, { status: 400 });
    if (typeof reason !== 'string' || reason.trim().length < 5)
      return NextResponse.json({ error: '退款理由至少 5 個字' }, { status: 400 });
    if (evidenceUrls && (!Array.isArray(evidenceUrls) || evidenceUrls.length > 5))
      return NextResponse.json({ error: '佐證資料格式錯誤或超過 5 個檔案' }, { status: 400 });
  
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds }, userId: user.id, status: 'COMPLETED', refundRequest: null },
    });
  
    if (orders.length !== orderIds.length) {
      const missing = orderIds.filter(id => !orders.some(o => o.id === id));
      return NextResponse.json({ error: '部分訂單無法退款', details: `以下訂單不符合退款條件：${missing.join(', ')}` }, { status: 400 });
    }
  
    const createdRefunds: any[] = [];
    try {
      await prisma.$transaction(async tx => {
        for (const order of orders) {
          const refund = await tx.refundRequest.create({
            data: { 
              orderId: order.id, 
              userId: user.id, 
              reason: reason.trim(), 
              status: 'PENDING',
              evidenceUrls: evidenceUrls || []
            },
          });
          createdRefunds.push(refund);
        }
      });
    return NextResponse.json({ success: true, count: createdRefunds.length, message: `已成功提交 ${createdRefunds.length} 筆批量退款申請`, refunds: createdRefunds.map(r => r.id) });
  } catch (error) {
    console.error('批量退款事務失敗:', error);
    return NextResponse.json({ error: '批量退款處理失敗，請稍後再試' }, { status: 500 });
  }
}
