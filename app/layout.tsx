import './globals.css'
import type { Metadata } from 'next'
import { Providers } from '@/components/Providers'
import Navbar from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: 'Beauty Social Commerce',
  description: 'KOL 直播帶貨平台',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className="dark">
      <body className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen font-sans antialiased">
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
