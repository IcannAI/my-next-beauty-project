'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function MessageButton({
    targetUserId,
    isLoggedIn
}: {
    targetUserId: string;
    isLoggedIn: boolean;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleMessage = async () => {
        if (!isLoggedIn) {
            router.push('/login');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ targetUserId })
            });
            const data = await res.json();

            if (res.ok && data.id) {
                // According to previous conversation, API returns conversation object directly or {id}
                router.push(`/messages/${data.id}`);
            } else if (res.ok && data.conversationId) {
                router.push(`/messages/${data.conversationId}`);
            } else {
                console.error('Failed to create conversation', data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            onClick={handleMessage}
            disabled={isLoading}
            variant="outline"
            className="border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 font-bold rounded-full gap-2 transition-all dark:border-rose-900 dark:hover:bg-rose-900/30"
        >
            <MessageCircle className="w-4 h-4" />
            私訊
        </Button>
    );
}
