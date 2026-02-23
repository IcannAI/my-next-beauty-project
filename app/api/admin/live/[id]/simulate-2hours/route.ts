import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  if (request.headers.get('x-test-mode') !== 'true')
    return new NextResponse('Not allowed', { status: 403 });
  return NextResponse.json({ success: true, message: '直播時間跳轉（骨架）' });
}
