'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Search, PlayCircle, MessageCircle, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { pusherClient } from '@/lib/pusher';

export default function BottomTabBar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const user = session?.user as any;
    const [unreadCount, setUnreadCount] = useState(0);

    // 所有 hooks 必須在條件判斷之前
    useEffect(() => {
        if (!session?.user || !user?.id) return;
        fetch('/api/conversations/unread')
            .then(res => res.json())
            .then(data => setUnreadCount(data.count || 0))
            .catch(() => { });

        const channel = pusherClient.subscribe(`user-${user.id}`);
        channel.bind('new-unread', () => {
            setUnreadCount(prev => prev + 1);
        });
        channel.bind('messages-read', () => {
            fetch('/api/conversations/unread')
                .then(res => res.json())
                .then(data => setUnreadCount(data.count || 0))
                .catch(() => { });
        });
        return () => {
            pusherClient.unsubscribe(`user-${user.id}`);
        };
    }, [session, user?.id]);

    // hooks 之後才做條件判斷
    const hiddenPaths = [
        '/live/',
        '/admin',
        '/dashboard',
        '/messages/',
    ];
    const shouldHide = hiddenPaths.some(p => pathname.startsWith(p));
    if (shouldHide) return null;

    const tabs = [
        {
            label: '首頁',
            href: '/',
            icon: Home,
            exact: true,
        },
        {
            label: '搜尋',
            href: '/search',
            icon: Search,
            exact: false,
        },
        {
            label: '直播',
            href: '/live',
            icon: PlayCircle,
            exact: false,
        },
        {
            label: '私訊',
            href: '/messages',
            icon: MessageCircle,
            exact: false,
            badge: unreadCount,
            requireAuth: true,
        },
        {
            label: '我的',
            href: session ? '/profile' : '/login',
            icon: User,
            exact: false,
        },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            <div className="border-t border-white/5 bg-gray-950/90 backdrop-blur-md">
                <div className="flex items-center justify-around px-2 py-2">
                    {tabs.map(tab => {
                        const isActive = tab.exact
                            ? pathname === tab.href
                            : pathname.startsWith(tab.href) && tab.href !== '/';
                        const isHomeActive = tab.href === '/' && pathname === '/';
                        const active = isActive || isHomeActive;

                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={cn(
                                    'relative flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 min-w-[56px] transition-all duration-200',
                                    active ? 'text-rose-500' : 'text-gray-500 hover:text-gray-300'
                                )}
                            >
                                <div className="relative">
                                    <tab.icon
                                        className={cn(
                                            'h-6 w-6 transition-transform duration-200',
                                            active && 'scale-110'
                                        )}
                                    />
                                    {tab.badge !== undefined && tab.badge > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-gray-950">
                                            {tab.badge > 99 ? '99+' : tab.badge}
                                        </span>
                                    )}
                                    {tab.href === '/live' && (
                                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        'text-[10px] font-bold tracking-wide',
                                        active ? 'text-rose-500' : 'text-gray-500'
                                    )}
                                >
                                    {tab.label}
                                </span>
                                {active && (
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-rose-500" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
