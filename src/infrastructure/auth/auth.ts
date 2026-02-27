// src/infrastructure/auth/auth.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth.config";

export async function getCurrentUser(request?: any): Promise<{ id: string, email?: string | null, name?: string | null, role?: string | null } | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return null;
  }

  const user = {
    id: (session.user as any).id,
    email: session.user.email,
    name: session.user.name,
    role: (session.user as any).role,
  };

  console.log('[Auth] getCurrentUser returning ID:', user.id, 'Role:', user.role);
  return user;
}
