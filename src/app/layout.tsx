import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Coy – Discover',
  description: 'Find your match privately. You never learn who likes you unless the feeling is mutual.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#0f0f0f] text-white min-h-screen antialiased selection:bg-rose-500 selection:text-white">
        {children}
      </body>
    </html>
  )
}
