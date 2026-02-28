'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface MessageButtonProps {
    targetUserId: string;
    isLoggedIn: boolean;
}

export default function MessageButton({
    targetUserId,
    isLoggedIn,
}: MessageButtonProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleClick = async () => {
        if (!isLoggedIn) {
            router.push('/login');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId }),
            });
            const data = await res.json();
            router.push(`/messages/${data.conversationId || data.id}`);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className="px-4 py-2 border border-rose-500 text-rose-500 rounded-full text-sm font-medium hover:bg-rose-50 transition-colors disabled:opacity-50"
        >
            {loading ? '載入中...' : '💬 私訊'}
        </button>
    );
}
