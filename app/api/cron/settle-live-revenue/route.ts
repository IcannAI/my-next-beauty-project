import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const CRON_SECRET = process.env.CRON_SECRET;
  if (request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`)
    return new NextResponse('Unauthorized', { status: 401 });

  return NextResponse.json({ success: true, message: '直播分潤結算 cron 已執行（骨架）' });
}
