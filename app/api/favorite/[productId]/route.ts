import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';
import { requireUser } from '@/infrastructure/auth/rbac';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/../auth.config";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const guard = await requireUser();
  if (guard) return guard;

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any).id;
  const { productId } = await params;

  try {
    await prisma.favorite.upsert({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      update: {},
      create: {
        userId,
        productId,
      },
    });

    return NextResponse.json({ favorited: true });
  } catch {
    return NextResponse.json({ error: 'Already favorited' }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const guard = await requireUser();
  if (guard) return guard;

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any).id;
  const { productId } = await params;

  try {
    await prisma.favorite.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    return NextResponse.json({ favorited: false });
  } catch {
    // If not found, return favorited: false anyway
    return NextResponse.json({ favorited: false });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ favorited: false });
    }

    const userId = (session.user as any).id;
    const { productId } = await params;

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    return NextResponse.json({ favorited: !!favorite });
  } catch {
    return NextResponse.json({ favorited: false });
  }
}
