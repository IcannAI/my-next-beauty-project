import { prisma } from '@/infrastructure/db/prisma';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Video, User, ArrowRight, PlayCircle } from 'lucide-react';

export default async function Home() {
  const liveStreams = await prisma.liveStream.findMany({
    where: { status: 'LIVE' },
    include: {
      kolProfile: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      startedAt: 'desc',
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gray-900 py-24 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=2834&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/40" />
        <div className="container relative mx-auto px-4 text-center">
          <Badge className="mb-4 bg-rose-500 hover:bg-rose-600 px-4 py-1 text-xs font-black uppercase tracking-widest border-none">
            New Arrival
          </Badge>
          <h1 className="mb-6 text-5xl font-black italic tracking-tighter md:text-7xl">
            BEAUTY <span className="text-rose-500">EXPERIENCE</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg font-medium text-gray-400">
            探索最頂尖的美容 KOL 直播，即時互動、限定優惠，為您帶來全新的購物體驗。
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="rounded-full bg-rose-500 px-8 py-6 text-lg font-black hover:bg-rose-600 shadow-xl shadow-rose-500/20">
              立即探索
            </Button>
            <Button size="lg" variant="outline" className="rounded-full border-2 px-8 py-6 text-lg font-black backdrop-blur-sm dark:border-white/10">
              了解更多
            </Button>
          </div>
        </div>
      </section>

      {/* Live Streams Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-12 flex items-end justify-between border-b border-gray-200 pb-6 dark:border-gray-800">
          <div>
            <h2 className="text-3xl font-black italic tracking-tighter text-gray-900 dark:text-white">
              進行中的 <span className="text-rose-500">LIVE</span>
            </h2>
            <p className="mt-2 font-bold text-gray-500 uppercase tracking-widest text-xs">Explore current live shopping events</p>
          </div>
          <Link href="/search" className="group flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-400 hover:text-rose-500 transition-colors">
            查看全部 <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {liveStreams.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-gray-200 bg-white py-32 text-center dark:border-gray-800 dark:bg-gray-900/50">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Video className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">目前沒有進行中的直播</h3>
            <p className="mt-2 font-medium text-gray-500">請稍後再回來看看，或關注您喜愛的 KOL。</p>
            <Button variant="outline" className="mt-8 rounded-full border-2 font-bold dark:border-gray-700" asChild>
              <Link href="/search">搜尋 KOL</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {liveStreams.map((stream) => (
              <Card key={stream.id} className="group overflow-hidden rounded-[2.5rem] border-none bg-white shadow-xl shadow-gray-200/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-rose-500/10 dark:bg-gray-900 dark:shadow-none">
                <CardHeader className="relative p-0 aspect-video overflow-hidden">
                  <div className="absolute inset-0 bg-gray-800" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PlayCircle className="h-16 w-16 text-white/20 group-hover:text-rose-500/50 transition-colors duration-500" />
                  </div>
                  <div className="absolute top-6 left-6 flex items-center gap-2">
                    <Badge className="bg-rose-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest border-none animate-pulse">
                      Live
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="mb-6 flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-rose-500/20">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${stream.kolProfile.user.name}`} />
                      <AvatarFallback>{stream.kolProfile.user.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-widest text-rose-500">KOL Host</p>
                      <p className="font-bold text-gray-900 dark:text-white">{stream.kolProfile.user.name}</p>
                    </div>
                  </div>
                  <CardTitle className="mb-4 text-2xl font-black italic tracking-tighter line-clamp-1 group-hover:text-rose-500 transition-colors">
                    {stream.title}
                  </CardTitle>
                </CardContent>
                <CardFooter className="px-8 pb-8 pt-0">
                  <Button className="w-full rounded-2xl bg-gray-950 py-6 font-black uppercase tracking-widest text-white hover:bg-rose-500 transition-all duration-500 group-hover:scale-[1.02]" asChild>
                    <Link href={`/live/${stream.id}`}>進入直播</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
