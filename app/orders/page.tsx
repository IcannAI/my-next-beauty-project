import { prisma } from '@/infrastructure/db/prisma';
import { getCurrentUser } from '@/infrastructure/auth/auth';
import { OrdersList } from './OrdersList';
import { redirect } from 'next/navigation';

export default async function OrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const orders = await prisma.order.findMany({
    where: {
      userId: user.id,
    },
    include: {
      refundRequest: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <main className="min-h-screen bg-gray-50/50 dark:bg-gray-950 transition-colors duration-500">
      <div className="container mx-auto py-16 px-4 max-w-3xl">
        <header className="mb-12 space-y-2">
          <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter italic">我的訂單</h1>
          <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-xs">Purchase History & Refunds</p>
        </header>

        <section className="mb-12 p-8 bg-rose-500 rounded-[2.5rem] shadow-2xl shadow-rose-200 dark:shadow-none text-white overflow-hidden relative group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10">
            <p className="text-rose-100 font-black uppercase tracking-[0.2em] text-[10px] mb-2">總累積消費</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black italic tracking-tighter">NT$ {totalSpent.toLocaleString()}</span>
              <span className="text-rose-200 text-xs font-bold">TWD</span>
            </div>
          </div>
        </section>

        <OrdersList orders={orders} />
      </div>
    </main>
  );
}
