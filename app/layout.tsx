import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Beauty Social Commerce',
  description: 'KOL 直播帶貨平台',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  )
}
