import { prisma } from '@/infrastructure/db/prisma';
import { getCurrentUser } from '@/infrastructure/auth/auth';
import { notFound, redirect } from 'next/navigation';
import { LiveChatClient } from '@/components/live/LiveChatClient';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EndLiveButton } from './EndLiveButton';

export default async function LiveStreamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const liveStream = await prisma.liveStream.findUnique({
    where: { id },
    include: {
      kolProfile: {
        include: {
          user: true,
          products: {
            where: { stock: { gt: 0 } },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      },
    },
  });

  if (!liveStream) {
    notFound();
  }

  const isOwner = user.id === liveStream.kolProfile.userId;
  const isAdmin = user.role === 'ADMIN';

  return (
    <main className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Video Area (Left) */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 bg-gray-900 m-4 rounded-[2.5rem] overflow-hidden relative shadow-2xl">
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50 backdrop-blur-3xl border-2 border-white/5 rounded-[2.5rem]">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-rose-500 rounded-full mx-auto flex items-center justify-center animate-pulse">
                <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-gray-500 italic">Connecting Video Stream...</p>
            </div>
          </div>

          {/* Overlay info */}
          <div className="absolute top-8 left-8 flex items-center gap-3">
            <Badge className="bg-rose-500 text-white border-none px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase animate-pulse shadow-lg shadow-rose-500/20">
              Live
            </Badge>
            <div className="px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-black tracking-widest uppercase border border-white/10">
              00:42:15
            </div>
          </div>
        </div>

        {/* KOL Info Footer */}
        <div className="px-10 py-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Avatar className="w-16 h-16 border-2 border-rose-500/20 shadow-xl">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${liveStream.kolProfile.user.name}`} />
              <AvatarFallback>{liveStream.kolProfile.user.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h1 className="text-2xl font-black tracking-tighter italic">{liveStream.title}</h1>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                {liveStream.kolProfile.user.name}
                <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                Social Commerce
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-xl font-black tracking-tighter italic">1.2k</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Viewers</p>
            </div>
            <div className="w-px h-10 bg-gray-800"></div>
            <div className="text-right">
              <p className="text-xl font-black tracking-tighter italic text-rose-500">248</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Shares</p>
            </div>
            {(isOwner || isAdmin) && (
              <div className="ml-4">
                <EndLiveButton liveId={id} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Client (Right) */}
      <div className="w-[400px] flex-shrink-0">
        <LiveChatClient
          liveStreamId={id}
          currentUserId={user.id}
          currentUserName={user.name || 'Anonymous'}
          isOwner={isOwner}
          isAdmin={isAdmin}
          products={liveStream.kolProfile.products.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            imageUrl: p.imageUrl,
            stock: p.stock,
          }))}
        />
      </div>
    </main>
  );
}
