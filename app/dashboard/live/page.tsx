import { prisma } from '../../../src/infrastructure/db/prisma';
import { getCurrentUser } from '../../../src/infrastructure/auth/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../src/components/ui/badge';
import { Video, Calendar, DollarSign, ChevronRight } from 'lucide-react';

export default async function LiveDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const kolProfile = await prisma.kolProfile.findUnique({
    where: { userId: user.id },
    include: {
      liveStreams: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!kolProfile) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center space-y-4 bg-white dark:bg-gray-900 p-12 rounded-[2.5rem] shadow-xl">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-rose-500" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">你尚未成為 KOL</h1>
          <p className="text-gray-500 max-w-xs mx-auto">請先申請成為 KOL 即可開始進行直播帶貨並獲得分潤。</p>
          <Button className="rounded-full bg-rose-500 hover:bg-rose-600 text-white px-8">立即申請</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-500">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter italic">直播管理</h1>
            <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-xs">Live Stream Studio & History</p>
          </div>
          <Link href="/dashboard/live/start">
            <Button className="rounded-full px-10 py-6 h-auto bg-rose-500 hover:bg-rose-600 text-white font-black shadow-xl shadow-rose-200 dark:shadow-none transition-all active:scale-95">
              開始新直播
            </Button>
          </Link>
        </header>

        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
              <Video className="w-5 h-5 text-rose-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">直播歷史列表</h2>
          </div>

          <div className="grid gap-4">
            {kolProfile.liveStreams.length === 0 ? (
              <div className="py-20 text-center bg-white dark:bg-gray-900 rounded-[2.5rem] border-2 border-dashed dark:border-gray-800">
                <p className="font-bold text-gray-400 dark:text-gray-600 tracking-tight text-lg">還沒有任何直播記錄</p>
                <p className="text-sm text-gray-400 mt-2">快來開啟你的第一場直播吧！</p>
              </div>
            ) : (
              kolProfile.liveStreams.map((stream) => (
                <div
                  key={stream.id}
                  className="group flex flex-col md:flex-row md:items-center justify-between p-8 bg-white dark:bg-gray-900 border-2 border-transparent hover:border-rose-500/20 rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 dark:shadow-none transition-all duration-500"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight group-hover:text-rose-500 transition-colors uppercase">
                        {stream.title}
                      </h3>
                      <Badge className={`
                        rounded-full px-4 py-1 text-[9px] font-black tracking-widest uppercase border-none
                        ${stream.status === 'LIVE' ? 'bg-rose-500 text-white animate-pulse' : 
                          stream.status === 'ENDED' ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' : 
                          'bg-blue-50 text-blue-600'}
                      `}>
                        {stream.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-6 text-sm font-bold text-gray-400 dark:text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 opacity-50" />
                        {new Date(stream.createdAt).toLocaleDateString('zh-TW')}
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 opacity-50" />
                        總收益 NT$ {stream.totalRevenue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 md:mt-0 flex items-center gap-4">
                    <div className="text-right hidden md:block">
                      <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1 opacity-50">KOL Earnings</p>
                      <p className="text-xl font-black text-gray-900 dark:text-white italic tracking-tighter">
                        NT$ {stream.kolEarnings.toLocaleString()}
                      </p>
                    </div>
                    <Link href={`/live/${stream.id}`}>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl group-hover:bg-rose-500 group-hover:text-white transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

const Users = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
