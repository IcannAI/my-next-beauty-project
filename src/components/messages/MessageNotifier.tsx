'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { pusherClient } from '@/lib/pusher';
import { useToast } from '@/components/ui/ToastProvider';

interface Props {
    currentUserId: string;
}

export default function MessageNotifier({ currentUserId }: Props) {
    const pathname = usePathname();
    const { showToast } = useToast();

    useEffect(() => {
        const channel = pusherClient.subscribe(`user-${currentUserId}`);

        channel.bind('new-unread', (data: {
            conversationId: string;
            senderName: string;
            content: string;
        }) => {
            // 只有不在當前對話頁才顯示 toast
            const isInConversation = pathname === `/messages/${data.conversationId}`;
            if (!isInConversation) {
                showToast(
                    `${data.senderName}：${data.content.slice(0, 30)}${data.content.length > 30 ? '...' : ''}`,
                    'info',
                    data.conversationId
                );
            }
        });

        return () => {
            pusherClient.unsubscribe(`user-${currentUserId}`);
        };
    }, [currentUserId, pathname, showToast]);

    return null;
}
