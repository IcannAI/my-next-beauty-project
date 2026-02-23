// src/app/api/search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { searchUsers } from '@/application/search/SearchApplicationService';
import tracer from 'dd-trace'; // Placeholder: need to ensure this module is available or mocked

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';
  const rootSpan = tracer.scope().active();
  rootSpan?.addTags({ 'search.query': q.slice(0, 100), 'http.route': '/api/search' });

  try {
    const result = await searchUsers({ query: q });
    return NextResponse.json(result);
  } catch (err) {
    rootSpan?.setTag('error', true);
    return NextResponse.json({ error: '搜尋失敗' }, { status: 500 });
  }
}
