// src/infrastructure/auth/auth.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth.config";

export async function getCurrentUser(request?: any): Promise<{ id: string, email?: string | null, name?: string | null } | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return null;
  }

  return {
    id: (session.user as any).id,
    email: session.user.email,
    name: session.user.name,
  };
}
