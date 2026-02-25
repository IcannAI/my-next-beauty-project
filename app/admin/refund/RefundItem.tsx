'use client';

import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { useToast } from '../../../components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface RefundItemProps {
  refund: {
    id: string;
    orderId: string;
    reason: string;
    status: string;
    createdAt: Date;
    order: {
      id: string;
    };
  };
}

export default function RefundItem({ refund }: RefundItemProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleReview = async (action: 'APPROVE' | 'REJECT') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/refund/${refund.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) throw new Error('Action failed');

      toast({
        title: 'Success',
        description: `Refund ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully`,
      });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update refund status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    APPROVED: 'bg-green-100 text-green-700 border-green-200',
    REJECTED: 'bg-red-100 text-red-700 border-red-200',
  };

  const statusLabels: Record<string, string> = {
    PENDING: '待處理',
    APPROVED: '已通過',
    REJECTED: '已拒絕',
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-50 flex flex-col space-y-6 transition-all hover:shadow-2xl hover:shadow-rose-100/50">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md tracking-wider uppercase">Order</span>
            <h3 className="font-mono font-bold text-gray-800 tracking-tight">{refund.order.id}</h3>
          </div>
          <p className="text-sm text-gray-400 font-medium">
            申請日期：{new Date(refund.createdAt).toLocaleDateString('zh-TW', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${statusColors[refund.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
          {statusLabels[refund.status] || refund.status}
        </span>
      </div>

      <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">退款理由</h4>
        <p className="text-gray-700 leading-relaxed font-medium">{refund.reason}</p>
      </div>

      {refund.status === 'PENDING' && (
        <div className="flex space-x-4 pt-2">
          <Button
            onClick={() => handleReview('APPROVE')}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white flex-1 py-6 rounded-2xl font-bold shadow-lg shadow-green-100"
          >
            通過申請
          </Button>
          <Button
            onClick={() => handleReview('REJECT')}
            disabled={loading}
            variant="outline"
            className="border-2 border-red-500 text-red-600 hover:bg-red-50 flex-1 py-6 rounded-2xl font-bold transition-colors"
          >
            拒絕申請
          </Button>
        </div>
      )}
    </div>
  );
}
