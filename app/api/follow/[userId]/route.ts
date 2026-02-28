import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';
import { requireUser } from '@/infrastructure/auth/rbac';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/../auth.config";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const guard = await requireUser();
  if (guard) return guard;

  const session = await getServerSession(authOptions);
  const followerId = (session?.user as any).id;
  const { userId: followingId } = await params;

  if (followerId === followingId) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  try {
    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
      update: {},
      create: {
        followerId,
        followingId,
      },
    });

    return NextResponse.json({ following: true });
  } catch {
    return NextResponse.json({ error: "Already following" }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const guard = await requireUser();
  if (guard) return guard;

  const session = await getServerSession(authOptions);
  const followerId = (session?.user as any).id;
  const { userId: followingId } = await params;

  try {
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return NextResponse.json({ following: false });
  } catch {
    // If not found, return following: false anyway
    return NextResponse.json({ following: false });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ following: false });
    }

    const followerId = (session.user as any).id;
    const { userId: followingId } = await params;

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return NextResponse.json({ following: !!follow });
  } catch {
    return NextResponse.json({ following: false });
  }
}
