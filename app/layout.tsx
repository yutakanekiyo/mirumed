import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'mirumed - 医療動画コミュニケーション',
  description: '医師から患者へ、動画で伝える新しい医療コミュニケーション',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-background">{children}</body>
    </html>
  )
}
