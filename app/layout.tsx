import './globals.css'
import type { Metadata } from 'next'
import { Providers } from '@/components/Providers'
import Navbar from '@/components/layout/Navbar'
import BottomTabBar from '@/components/layout/BottomTabBar'
import ToastProvider from '@/components/ui/ToastProvider'
import CartDrawer from '@/components/cart/CartDrawer'

export const metadata: Metadata = {
  title: 'Beauty Social Commerce',
  description: 'KOL 直播帶貨平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('beautylive_theme');
                  var isDark = theme === 'dark' ||
                    (!theme || theme === 'system') &&
                    window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (isDark) document.documentElement.classList.add('dark');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen font-sans antialiased">
        <Providers>
          <ToastProvider>
            <div className="relative flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1 pb-16 md:pb-0">
                {children}
                <CartDrawer />
              </main>
              <BottomTabBar />
            </div>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  )
}
