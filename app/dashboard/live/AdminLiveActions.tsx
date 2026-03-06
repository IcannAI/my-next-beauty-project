'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Archive, RefreshCw } from 'lucide-react';

export default function AdminLiveActions({
    streamId,
    status,
}: {
    streamId: string;
    status: string;
}) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleArchive = async () => {
        if (status === 'LIVE') {
            alert('無法下架進行中的直播');
            return;
        }
        if (status === 'ARCHIVED') {
            alert('此直播已下架');
            return;
        }
        if (!confirm('確定要下架此直播？下架後將不會顯示在直播列表。')) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/live/${streamId}/archive`, {
                method: 'PATCH',
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || '下架失敗');
                return;
            }
            router.refresh();
        } catch {
            alert('下架失敗，請重試');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        if (!confirm('確定要還原此直播？')) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/live/${streamId}/archive`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || '還原失敗');
                return;
            }
            router.refresh();
        } catch {
            alert('還原失敗，請重試');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'ARCHIVED') {
        return (
            <Button
                size="sm"
                variant="ghost"
                onClick={handleRestore}
                disabled={loading}
                className="rounded-full hover:bg-blue-50 hover:text-blue-600 text-xs"
            >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                還原
            </Button>
        );
    }

    return (
        <Button
            size="sm"
            variant="ghost"
            onClick={handleArchive}
            disabled={loading || status === 'LIVE'}
            className="rounded-full hover:bg-orange-50 hover:text-orange-600 disabled:opacity-30 text-xs"
        >
            <Archive className="w-3.5 h-3.5 mr-1" />
            下架
        </Button>
    );
}
