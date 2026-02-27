import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth.config";
import { NextResponse } from "next/server";

export async function checkRole(allowedRoles: string[]) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || !allowedRoles.includes(user.role)) {
    return false;
  }
  return true;
}

export async function requireUser() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || !["USER", "KOL", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  return null;
}

export async function requireKOL() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || !["KOL", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  return null;
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  return null;
}
