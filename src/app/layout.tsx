import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import './globals.css'
import { cn } from '@/lib/utils'
import { Toaster } from 'sonner'
import ReactQueryProvider from '@/components/react-query-provider'
import Navbar from '@/components/navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Stupell Industries | PDF tool',
  description: 'Stupell Industries PDF to Spreadsheet Export Custom Tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-US" suppressHydrationWarning >

      <body className={cn("w-screen h-screen flex flex-col", inter.className)}>
        <ReactQueryProvider>
          <Toaster theme="dark" />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
            <Navbar />
            <div className='grow'>
              {children}
            </div>
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  )
}
