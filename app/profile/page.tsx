'use client';

import { cn } from '@/lib/utils';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Avatar from '@/components/shared/Avatar';
import {
    ShoppingBag, Heart, Bell, Users, LayoutDashboard,
    DollarSign, Settings, LogOut, LogIn, ChevronRight,
    UserCircle, RefreshCcw, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MenuItem {
    label: string;
    href?: string;
    icon: React.ElementType;
    badge?: number;
    onClick?: () => void;
    external?: boolean;
    danger?: boolean;
}

interface MenuSection {
    title?: string;
    items: MenuItem[];
}

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const user = session?.user as any;

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // 未登入
    if (!session) {
        return (
            <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 gap-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500 shadow-lg shadow-rose-500/20">
                    <span className="text-2xl font-black italic text-white">B</span>
                </div>
                <div className="text-center">
                    <h1 className="text-2xl font-black text-white mb-2">
                        歡迎來到 BEAUTYLIVE
                    </h1>
                    <p className="text-gray-400 text-sm">登入後享受完整功能</p>
                </div>
                <Button
                    asChild
                    className="w-full max-w-xs rounded-full bg-rose-500 font-bold text-white hover:bg-rose-600 h-12"
                >
                    <Link href="/login">
                        <LogIn className="mr-2 h-5 w-5" />
                        立即登入
                    </Link>
                </Button>
            </div>
        );
    }

    const isKOL = user?.role === 'KOL' || user?.role === 'ADMIN';
    const isAdmin = user?.role === 'ADMIN';

    const menuSections: MenuSection[] = [
        {
            title: '我的帳戶',
            items: [
                { label: '我的訂單', href: '/orders', icon: ShoppingBag },
                { label: '我的收藏', href: '/favorites', icon: Heart },
                { label: '通知', href: '/notifications', icon: Bell },
                { label: '退款記錄', href: '/orders', icon: RefreshCcw },
            ],
        },
        ...(isKOL ? [{
            title: 'KOL 專區',
            items: [
                {
                    label: '我的個人頁',
                    href: `/kol/${user?.id}`,
                    icon: UserCircle,
                },
                {
                    label: '產品管理',
                    href: '/dashboard/products',
                    icon: ShoppingBag,
                },
                {
                    label: '直播管理',
                    href: '/dashboard/live',
                    icon: LayoutDashboard,
                },
                {
                    label: '分潤紀錄',
                    href: '/dashboard/settlement',
                    icon: DollarSign,
                },
            ],
        }] : []),
        ...(isAdmin ? [{
            title: '管理後台',
            items: [
                { label: '用戶管理', href: '/admin/users', icon: Users },
                { label: '退款審核', href: '/admin/refund', icon: Settings },
                {
                    label: 'Datadog',
                    href: 'https://app.datadoghq.com',
                    icon: ExternalLink,
                    external: true,
                },
            ],
        }] : []),
        {
            items: [
                {
                    label: '登出',
                    icon: LogOut,
                    onClick: () => signOut({ callbackUrl: '/' }),
                    danger: true,
                },
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-gray-950 pb-8">
            {/* 頂部個人資訊 */}
            <div className="bg-gray-900 px-6 pt-10 pb-8 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <Avatar
                        avatarUrl={user?.image}
                        name={user?.name}
                        size={64}
                    />
                    <div>
                        <h1 className="text-xl font-black text-white">
                            {user?.name || '用戶'}
                        </h1>
                        <p className="text-sm text-gray-400">{user?.email}</p>
                        <span className={`
              mt-1 inline-block text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full
              ${user?.role === 'ADMIN'
                                ? 'bg-purple-500/20 text-purple-400'
                                : user?.role === 'KOL'
                                    ? 'bg-rose-500/20 text-rose-400'
                                    : 'bg-gray-700 text-gray-400'}
            `}>
                            {user?.role || 'USER'}
                        </span>
                    </div>
                </div>
            </div>

            {/* 選單區塊 */}
            <div className="px-4 pt-6 space-y-6">
                {menuSections.map((section, sectionIdx) => (
                    <div key={sectionIdx}>
                        {section.title && (
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 px-2">
                                {section.title}
                            </p>
                        )}
                        <div className="bg-gray-900 rounded-2xl overflow-hidden border border-white/5">
                            {section.items.map((item, itemIdx) => {
                                const content = (
                                    <div
                                        className={cn(
                                            'flex items-center gap-3 px-4 py-3.5 transition-colors',
                                            item.danger
                                                ? 'hover:bg-rose-500/10'
                                                : 'hover:bg-white/5',
                                            itemIdx < section.items.length - 1 &&
                                            'border-b border-white/5'
                                        )}
                                    >
                                        <item.icon
                                            className={cn(
                                                'h-5 w-5 flex-shrink-0',
                                                item.danger ? 'text-rose-500' : 'text-gray-400'
                                            )}
                                        />
                                        <span
                                            className={cn(
                                                'flex-1 text-sm font-bold',
                                                item.danger ? 'text-rose-500' : 'text-gray-200'
                                            )}
                                        >
                                            {item.label}
                                        </span>
                                        {item.badge !== undefined && item.badge > 0 && (
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                                                {item.badge}
                                            </span>
                                        )}
                                        {item.external && (
                                            <ExternalLink className="h-3.5 w-3.5 text-gray-600" />
                                        )}
                                        {!item.danger && !item.external && (
                                            <ChevronRight className="h-4 w-4 text-gray-600" />
                                        )}
                                    </div>
                                );

                                if (item.onClick) {
                                    return (
                                        <button
                                            key={item.label}
                                            onClick={item.onClick}
                                            className="w-full text-left"
                                        >
                                            {content}
                                        </button>
                                    );
                                }

                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href!}
                                        target={item.external ? '_blank' : undefined}
                                    >
                                        {content}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
