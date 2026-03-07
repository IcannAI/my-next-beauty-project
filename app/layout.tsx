// ✅ 26. Datadog RUM — 加入 RUM snippet

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
        {/* Dark mode initializer — runs before render to avoid flash */}
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

        {/* ✅ 26. Datadog RUM — Real User Monitoring */}
        {process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function(h,o,u,n,d) {
                  h=h[d]=h[d]||{q:[],onReady:function(c){h.q.push(c)}}
                  d=o.createElement(u);d.async=1;d.src=n
                  n=o.getElementsByTagName(u)[0];n.parentNode.insertBefore(d,n)
                })(window,document,'script','https://www.datadoghq-browser-agent.com/us1/v5/datadog-rum.js','DD_RUM')
                window.DD_RUM.onReady(function() {
                  window.DD_RUM.init({
                    applicationId: '${process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID}',
                    clientToken: '${process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN}',
                    site: 'datadoghq.com',
                    service: 'glowsocial-frontend',
                    env: '${process.env.NODE_ENV}',
                    version: '1.0.0',
                    sessionSampleRate: 100,
                    sessionReplaySampleRate: 20,
                    trackUserInteractions: true,
                    trackResources: true,
                    trackLongTasks: true,
                    defaultPrivacyLevel: 'mask-user-input',
                  });
                });
              `,
            }}
          />
        )}
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