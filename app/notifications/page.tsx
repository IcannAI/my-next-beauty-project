import { prisma } from '@/infrastructure/db/prisma';
import { getCurrentUser } from '@/infrastructure/auth/auth';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Bell, Package, CheckCircle, XCircle, DollarSign, HelpCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  let anomalies: any[] = [];
  if (user.role === 'ADMIN') {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/admin/orders/anomaly`, {
        headers: {
          cookie: cookieStore.toString(),
        },
      });
      if (res.ok) {
        const data = await res.json();
        anomalies = data.anomalies || [];
      }
    } catch (err) {
      console.error('Fetch anomalies error:', err);
    }
  }

  const notifications = await prisma.notification.findMany({
    where: user.role === 'ADMIN' ? {} : { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'order_created': return 'bg-blue-500 text-white';
      case 'refund_approved': return 'bg-green-500 text-white';
      case 'refund_rejected': return 'bg-red-500 text-white';
      case 'settlement': return 'bg-purple-500 text-white';
      case 'survey_reminder': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order_created': return <Package className="w-5 h-5" />;
      case 'refund_approved': return <CheckCircle className="w-5 h-5" />;
      case 'refund_rejected': return <XCircle className="w-5 h-5" />;
      case 'settlement': return <DollarSign className="w-5 h-5" />;
      case 'survey_reminder': return <HelpCircle className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  return (
    <main className="min-h-screen bg-gray-50/50 p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-l-4 border-rose-500 pl-6 py-2">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase">
              通知中心 <span className="text-rose-500">{user.role === 'ADMIN' && '(管理員全視角)'}</span>
            </h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Stay updated with your latest alerts</p>
          </div>
          <Badge className="rounded-full px-6 py-2 bg-rose-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-200">
            {notifications.length} Total Alerts
          </Badge>
        </header>

        {user.role === 'ADMIN' && anomalies.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-[2rem] p-6 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm font-black">!</span>
              </div>
              <h3 className="font-black text-red-700 uppercase tracking-widest text-sm">
                異常訂單警示 ({anomalies.length})
              </h3>
            </div>
            {anomalies.map((anomaly, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-4 border border-red-100">
                <p className="text-sm font-bold text-red-700">
                  {anomaly.type === 'duplicate_order'
                    ? `重複下單：${anomaly.userName} (${anomaly.userEmail}) 對「${anomaly.productName}」下單 ${anomaly.orderCount} 次`
                    : `大量下單：${anomaly.userName} (${anomaly.userEmail}) ${anomaly.message}`
                  }
                </p>
                {anomaly.orders && (
                  <div className="mt-2 space-y-1">
                    {anomaly.orders.map((o: any) => (
                      <p key={o.id} className="text-xs text-gray-500">
                        訂單 #{o.id.slice(-8)} · NT$ {o.amount} ·
                        {new Date(o.createdAt).toLocaleString('zh-TW')}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <section className="space-y-4">
          {notifications.length === 0 ? (
            <div className="py-32 text-center bg-white rounded-[3rem] shadow-xl border border-gray-100">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="w-10 h-10 text-rose-500 opacity-20" />
              </div>
              <p className="font-bold text-gray-400 tracking-tight text-xl uppercase italic">目前沒有任何通知</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={cn(
                  "group relative overflow-hidden flex items-start gap-6 p-10 bg-white rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-rose-100",
                  !notif.read && "border-l-[12px] border-l-rose-500"
                )}
              >
                <div className={cn(
                  "p-5 rounded-3xl flex-shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-xl",
                  getBadgeStyle(notif.type)
                )}>
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <Badge className={cn("rounded-full px-4 py-1 text-[9px] font-black tracking-widest uppercase border-none", getBadgeStyle(notif.type))}>
                      {notif.type.replace('_', ' ')}
                    </Badge>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                      <Clock className="w-3 h-3" />
                      {new Date(notif.createdAt).toLocaleString('zh-TW')}
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-gray-900 tracking-tight italic group-hover:text-rose-500 transition-colors uppercase">
                    {notif.title}
                  </h3>
                  <p className="text-gray-500 font-medium leading-relaxed max-w-2xl">
                    {notif.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
