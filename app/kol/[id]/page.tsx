import { prisma } from '@/infrastructure/db/prisma';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/infrastructure/auth/auth';
import KolProfileEditor from '@/components/kol/KolProfileEditor';
import KolProfileView from '@/components/kol/KolProfileView';

export default async function KolProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  const profile = await prisma.kolProfile.findFirst({
    where: { userId: id },
    include: {
      user: true,
      liveStreams: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!profile) {
    notFound();
  }

  // Logic: Owner (role KOL) or ADMIN
  const isOwner = currentUser?.id === profile.userId && currentUser?.role === 'KOL';
  const isAdmin = currentUser?.role === 'ADMIN';
  const canEdit = isOwner || isAdmin;

  if (canEdit) {
    return <KolProfileEditor profile={profile as any} isAdmin={isAdmin} />;
  }

  // Only show last 5 streams for view mode
  const viewProfile = {
    ...profile,
    liveStreams: profile.liveStreams.slice(0, 5)
  };

  const follow = currentUser ? await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUser.id,
        followingId: profile.userId,
      }
    }
  }) : null;
  const initialFollowing = !!follow;

  return (
    <KolProfileView 
      profile={viewProfile as any} 
      initialFollowing={initialFollowing}
      isLoggedIn={!!currentUser}
    />
  );
}
