import { prisma } from '@/infrastructure/db/prisma';
import { getCurrentUser } from '@/infrastructure/auth/auth';
import { notFound, redirect } from 'next/navigation';
import { requireKOL, requireAdmin } from '@/infrastructure/auth/rbac';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Users, Package, Clock, Video } from 'lucide-react';
import { EndLiveButton } from '../../../live/[id]/EndLiveButton';

export default async function LiveDetailDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const liveStream = await prisma.liveStream.findUnique({
    where: { id },
    include: {
      orders: { include: { user: true } },
      kolProfile: true
    }
  });

  if (!liveStream) notFound();

  // Guard: Only owner or admin
  const isOwner = liveStream.kolProfile.userId === user.id;
  const isAdmin = user.role === 'ADMIN';
  if (!isOwner && !isAdmin) redirect('/');

  return (
    <main className="min-h-screen bg-gray-50/50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge className={
                liveStream.status === 'LIVE' ? 'bg-rose-500 text-white animate-pulse' :
                liveStream.status === 'ENDED' ? 'bg-gray-500 text-white' : 'bg-blue-500 text-white'
              }>
                {liveStream.status}
              </Badge>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">{liveStream.title}</h1>
            </div>
            <div className="flex flex-wrap gap-6 text-sm font-bold text-gray-400 uppercase tracking-widest">
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(liveStream.createdAt).toLocaleDateString()}</div>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {liveStream.startedAt ? new Date(liveStream.startedAt).toLocaleTimeString() : 'Not started'}</div>
            </div>
          </div>
          
          {liveStream.status === 'LIVE' && (
            <EndLiveButton liveId={id} />
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-gray-50 space-y-2">
            <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl w-fit"><DollarSign className="w-6 h-6" /></div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">總成交額</p>
            <p className="text-3xl font-black text-gray-900 italic">NT$ {liveStream.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-gray-50 space-y-2">
            <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl w-fit"><Users className="w-6 h-6" /></div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">KOL 預估收益</p>
            <p className="text-3xl font-black text-gray-900 italic">NT$ {liveStream.kolEarnings.toLocaleString()}</p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-gray-50 space-y-2">
            <div className="p-3 bg-purple-50 text-purple-500 rounded-2xl w-fit"><Package className="w-6 h-6" /></div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">結算狀態</p>
            <p className="text-2xl font-black text-gray-900 italic uppercase">{liveStream.settlementStatus}</p>
          </div>
        </div>

        <section className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-10 py-8 border-b border-gray-50 bg-gray-50/30 flex items-center gap-3">
            <Package className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase italic">訂單列表</h2>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50">
                <th className="px-10 py-6">User</th>
                <th className="px-10 py-6">Amount</th>
                <th className="px-10 py-6">Status</th>
                <th className="px-10 py-6">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {liveStream.orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-10 py-6 font-bold text-gray-900">{order.user.email}</td>
                  <td className="px-10 py-6 font-black text-gray-900 italic">NT$ {order.totalAmount.toLocaleString()}</td>
                  <td className="px-10 py-6">
                    <Badge variant="outline" className="font-black text-[9px] tracking-tighter uppercase">{order.status}</Badge>
                  </td>
                  <td className="px-10 py-6 text-xs text-gray-400 font-bold">{new Date(order.createdAt).toLocaleTimeString()}</td>
                </tr>
              ))}
              {liveStream.orders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-10 py-20 text-center text-gray-400 font-bold uppercase italic tracking-widest">尚未產生訂單</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
