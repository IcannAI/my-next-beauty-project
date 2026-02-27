import { prisma } from '@/infrastructure/db/prisma';
import RefundItem from './RefundItem';
import { getCurrentUser } from '@/infrastructure/auth/auth';
import { redirect } from 'next/navigation';

export default async function AdminRefundPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    redirect('/');
  }

  const refunds = await prisma.refundRequest.findMany({
    include: {
      order: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="min-h-screen bg-rose-50/20 p-8 sm:p-12 lg:p-20">
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="border-l-4 border-rose-500 pl-6 py-2">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            退款審核管理
          </h1>
          <p className="mt-3 text-lg text-gray-500 font-medium">
            處理客戶退款申請，確保服務品質。
          </p>
        </header>

        <section className="grid gap-8">
          {refunds.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl shadow-xl shadow-rose-100/50 border border-rose-100">
              <p className="text-gray-400 text-xl font-semibold">目前尚無退款申請。</p>
            </div>
          ) : (
            refunds.map((refund) => (
              <RefundItem key={refund.id} refund={refund} />
            ))
          )}
        </section>
      </div>
    </div>
  );
}
