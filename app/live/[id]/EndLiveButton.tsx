'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function EndLiveButton({ liveId }: { liveId: string }) {
  const [isEnding, setIsEnding] = useState(false);
  const router = useRouter();

  const handleEnd = async () => {
    if (!confirm('確定要結束直播嗎？')) return;

    setIsEnding(true);
    try {
      const res = await fetch(`/api/live/${liveId}/end`, {
        method: 'POST',
      });

      if (res.ok) {
        router.push('/dashboard/live');
        router.refresh();
      } else {
        alert('結束失敗');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleEnd}
      disabled={isEnding}
      className="rounded-full px-6 border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all font-bold text-xs uppercase tracking-widest h-auto py-3"
    >
      {isEnding ? '結束中...' : '結束直播'}
    </Button>
  );
}
