'use client';

import { useState, useEffect } from 'react';
import { pusherClient } from '@/lib/pusher';

interface UnreadBadgeProps {
    currentUserId: string;
    initialCount?: number;
}

export default function UnreadBadge({ currentUserId, initialCount }: UnreadBadgeProps) {
    const [unreadCount, setUnreadCount] = useState(initialCount ?? 0);

    useEffect(() => {
        if (initialCount === undefined) {
            fetch('/api/conversations/unread')
                .then(res => res.json())
                .then(data => setUnreadCount(data.count || 0))
                .catch(() => { });
        }
    }, [initialCount]);

    useEffect(() => {
        if (!currentUserId) return;

        const channel = pusherClient.subscribe(`user-${currentUserId}`);

        // Listening for new unread messages
        channel.bind('new-unread', () => {
            setUnreadCount((prev) => prev + 1);
        });

        // Optional: Listening for mark-as-read events if we implement it later
        channel.bind('messages-read', (data: { countVal?: number }) => {
            if (data && data.countVal !== undefined) {
                setUnreadCount(data.countVal);
            } else {
                // Generic decrement or sync
                fetch('/api/conversations/unread')
                    .then(res => res.json())
                    .then(data => setUnreadCount(data.count || 0))
                    .catch(() => { });
            }
        });

        return () => {
            pusherClient.unsubscribe(`user-${currentUserId}`);
        };
    }, [currentUserId]);

    if (unreadCount <= 0) return null;

    return (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-gray-950">
            {unreadCount > 99 ? '99+' : unreadCount}
        </span>
    );
}
