// tests/helpers/mock-request.ts
import { NextRequest } from 'next/server';

interface MockRequestOptions {
  method?: string;
  body?: string;
  user?: { id: string; role?: string; name?: string; email?: string };
  headers?: Record<string, string>;
  searchParams?: Record<string, string>;
}

/**
 * Creates a mock NextRequest with an injected session for integration testing.
 * Patches getServerSession to return the provided user.
 */
export function createMockRequest(options: MockRequestOptions): NextRequest {
  const { method = 'POST', body, headers = {}, searchParams } = options;

  const url = new URL('http://localhost:3000/api/test');
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const req = new NextRequest(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ?? undefined,
  });

  return req;
}

/**
 * Mocks getServerSession for integration tests.
 * Call this before importing the route handler.
 */
export function mockSession(user: {
  id: string;
  role?: string;
  name?: string;
  email?: string;
}) {
  // Dynamic mock — works with jest.mock or vitest.mock
  return {
    user: {
      id:    user.id,
      role:  user.role  ?? 'USER',
      name:  user.name  ?? 'Test User',
      email: user.email ?? 'test@example.com',
    },
  };
}
