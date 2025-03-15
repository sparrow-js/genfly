import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import '@unocss/reset/tailwind.css'
import './globals.css'
import '@/styles/index.scss?url';


const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Genfly | Fast-track your idea to reality',
  description: 'Genfly is a platform that allows you to fast-track your idea to reality.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased w-full h-full`}
      >
        {children}
      </body>
    </html>
  )
}
