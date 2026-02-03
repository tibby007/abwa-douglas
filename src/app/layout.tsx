import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ABWA-Douglas Chapter - Financial Tracker',
  description: 'Financial approval and tracking system for ABWA Douglas Chapter',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-800 antialiased">
        {children}
      </body>
    </html>
  )
}
