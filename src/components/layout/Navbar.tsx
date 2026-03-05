'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Video, Search, ShoppingBag, LayoutDashboard,
  Settings, LogIn, LogOut, Bell, DollarSign,
  Users, ExternalLink, Heart, MessageCircle,
  PlayCircle, ShoppingCart
} from 'lucide-react';
import UnreadBadge from '@/components/messages/UnreadBadge';
import MessageNotifier from '@/components/messages/MessageNotifier';

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const user = session?.user as any;

  const publicItems = [
    { label: '首頁', href: '/', icon: Video },
    { label: '搜尋', href: '/search', icon: Search },
    { label: '直播', href: '/live', icon: PlayCircle },
  ];

  const loggedInItems = session ? [
    { label: '訂單', href: '/orders', icon: ShoppingBag },
    { label: '收藏', href: '/favorites', icon: Heart },
    { label: '通知', href: '/notifications', icon: Bell },
    { label: '私訊', href: '/messages', icon: MessageCircle },
  ] : [];

  const kolItems = (user?.role === 'KOL' || user?.role === 'ADMIN') ? [
    { label: '直播', href: '/dashboard/live', icon: LayoutDashboard },
    { label: '產品', href: '/dashboard/products', icon: ShoppingBag },
    { label: '分潤', href: '/dashboard/settlement', icon: DollarSign },
  ] : [];

  const adminItems = user?.role === 'ADMIN' ? [
    { label: '用戶', href: '/admin/users', icon: Users },
    { label: '審核', href: '/admin/refund', icon: Settings },
    { label: 'DD', href: 'https://app.datadoghq.com', icon: ExternalLink, external: true },
  ] : [];

  const allItems = [...publicItems, ...loggedInItems, ...kolItems, ...adminItems];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-gray-950/80 backdrop-blur-md">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="flex h-16 items-center gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500 shadow-lg shadow-rose-500/20">
              <Video className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black italic tracking-tighter text-white hidden sm:block">
              BEAUTY<span className="text-rose-500">LIVE</span>
            </span>
          </Link>

          {/* 桌機導航連結 */}
          <div className="hidden lg:flex lg:items-center lg:gap-0.5 flex-1 overflow-x-auto scrollbar-none">
            {allItems.map((item: any) => (
              <Link
                key={item.href}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                className={cn(
                  'relative flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition-all whitespace-nowrap flex-shrink-0',
                  pathname === item.href || (!item.external && pathname.startsWith(item.href) && item.href !== '/')
                    ? 'bg-white/10 text-rose-500'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                )}
              >
                <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                {item.label}
                {item.href === '/messages' && session?.user && (
                  <div className="relative">
                    <MessageNotifier currentUserId={user?.id} />
                    <UnreadBadge currentUserId={user?.id} />
                  </div>
                )}
                {item.external && <ExternalLink className="h-3 w-3 opacity-50" />}
              </Link>
            ))}
          </div>

          {/* 右側 */}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            {status === 'loading' ? (
              <div className="h-8 w-20 animate-pulse rounded-full bg-white/5" />
            ) : session ? (
              <div className="flex items-center gap-2">
                <span className="hidden xl:block text-sm font-bold text-white">
                  {session.user?.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                  className="rounded-full border border-white/10 text-xs font-bold text-gray-400 hover:bg-rose-500 hover:text-white px-3"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1.5" />
                  登出
                </Button>
              </div>
            ) : (
              <Button
                asChild
                size="sm"
                className="rounded-full bg-rose-500 text-xs font-bold text-white hover:bg-rose-600 px-3"
              >
                <Link href="/login">
                  <LogIn className="h-3.5 w-3.5 mr-1.5" />
                  登入
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
