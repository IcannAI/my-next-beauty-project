import { NextRequest } from 'next/server';
export async function getCurrentUser(request: NextRequest) {
  const userId = request.headers.get('x-user-id') || 'test-user-id';
  return { id: userId, email: 'test@example.com', name: 'Test User' };
}
