import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import MainLayout from '@/components/layout/MainLayout'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata = {
  title: 'Library Management System - DZUELS',
  description:
    'Digital Zone United Evangelical Lutheran School Library Management System',
}

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  )
}
