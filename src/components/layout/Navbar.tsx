'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Video, Search, ShoppingBag, LayoutDashboard, Settings, LogIn, LogOut } from 'lucide-react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const user = session?.user as any;

  const publicItems = [
    { label: '首頁', href: '/', icon: Video },
    { label: '搜尋', href: '/search', icon: Search },
  ];

  const loggedInItems = session ? [
    { label: '我的訂單', href: '/orders', icon: ShoppingBag },
  ] : [];

  const kolItems = (user?.role === 'KOL' || user?.role === 'ADMIN') ? [
    { label: '直播管理', href: '/dashboard/live', icon: LayoutDashboard },
  ] : [];

  const adminItems = user?.role === 'ADMIN' ? [
    { label: '後台審核', href: '/admin/refund', icon: Settings },
  ] : [];

  const allItems = [...publicItems, ...loggedInItems, ...kolItems, ...adminItems];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-gray-950/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500 shadow-lg shadow-rose-500/20">
                <Video className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-black italic tracking-tighter text-white">
                BEAUTY<span className="text-rose-500">LIVE</span>
              </span>
            </Link>

            <div className="hidden md:flex md:items-center md:gap-1">
              {allItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all",
                    pathname === item.href
                      ? "bg-white/10 text-rose-500"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {status === 'loading' ? (
              <div className="h-9 w-24 animate-pulse rounded-full bg-white/5" />
            ) : session ? (
              <div className="flex items-center gap-4">
                <div className="hidden flex-col items-end md:flex">
                  <span className="text-xs font-black uppercase tracking-widest text-gray-500">Welcome</span>
                  <span className="text-sm font-bold text-white">{session.user?.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                  className="rounded-full border border-white/10 font-bold text-gray-400 hover:bg-rose-500 hover:text-white"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  登出
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => signIn()}
                className="rounded-full bg-rose-500 font-bold text-white hover:bg-rose-600"
              >
                <LogIn className="mr-2 h-4 w-4" />
                登入
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
