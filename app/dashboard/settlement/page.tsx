import { prisma } from '@/infrastructure/db/prisma';
import { getCurrentUser } from '@/infrastructure/auth/auth';
import { redirect } from 'next/navigation';
import { requireKOL } from '@/infrastructure/auth/rbac';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Calendar, Video, ArrowUpRight, TrendingUp } from 'lucide-react';

export default async function SettlementPage() {
  const guard = await requireKOL();
  if (guard) redirect('/');

  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const settledStreams = await prisma.liveStream.findMany({
    where: { 
      kolProfile: { userId: user.id },
      settlementStatus: 'SETTLED'
    },
    orderBy: { createdAt: 'desc' }
  });

  const totalEarnings = settledStreams.reduce((sum, stream) => sum + stream.kolEarnings, 0);

  return (
    <main className="min-h-screen bg-gray-50/50 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-l-4 border-rose-500 pl-6 py-2">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase">
              分潤結算紀錄
            </h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Earnings Overview & Settlement History</p>
          </div>
          
          <div className="bg-white rounded-[2rem] px-10 py-8 shadow-xl border border-rose-100 flex items-center gap-6">
            <div className="p-4 bg-rose-500 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">累積總收益</p>
              <p className="text-3xl font-black text-rose-500 italic tracking-tighter">NT$ {totalEarnings.toLocaleString()}</p>
            </div>
          </div>
        </header>

        <section className="grid gap-6">
          {settledStreams.length === 0 ? (
            <div className="py-32 text-center bg-white rounded-[3rem] shadow-xl border border-gray-100">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <DollarSign className="w-10 h-10 text-rose-500 opacity-20" />
              </div>
              <p className="font-bold text-gray-400 tracking-tight text-xl uppercase italic">目前尚未有結算紀錄</p>
              <p className="text-sm text-gray-400 mt-2">快來開啟你的直播獲取收益吧！</p>
            </div>
          ) : (
            settledStreams.map((stream) => (
              <div
                key={stream.id}
                className="group relative flex flex-col md:flex-row md:items-center justify-between p-10 bg-white rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-rose-100 overflow-hidden"
              >
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight italic group-hover:text-rose-500 transition-colors uppercase">
                      {stream.title}
                    </h3>
                    <Badge className="rounded-full px-4 py-1 text-[9px] font-black tracking-widest uppercase border-none bg-green-500 text-white">
                      Settled
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-8 text-sm font-bold text-gray-400">
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

                <div className="mt-8 md:mt-0 flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1 opacity-50 italic">Your Earnings</p>
                    <p className="text-3xl font-black text-gray-900 italic tracking-tighter">
                      NT$ {stream.kolEarnings.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-5 bg-gray-50 rounded-3xl group-hover:bg-rose-500 group-hover:text-white transition-all group-hover:rotate-12">
                    <ArrowUpRight className="w-6 h-6" />
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
