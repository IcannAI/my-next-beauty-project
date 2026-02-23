// src/infrastructure/auth/auth.ts
// This is a mock implementation as per ARCHITECTURE.md
export async function getCurrentUser(request?: any): Promise<{ id: string }> {
  return { id: 'test-user-id' };
}
