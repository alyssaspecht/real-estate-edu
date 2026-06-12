import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { TopNav } from '@/components/TopNav'
import { MeshBackground } from '@/components/MeshBackground'
import { getCurrentUser } from '@/lib/auth/getUser'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'RE Academy — Real Estate Education',
  description: 'Learn from the best real estate professionals',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <MeshBackground />
          <div className="relative z-10 flex flex-col flex-1">
            <TopNav userRole={user?.role} userName={user?.name} />
            <main className="flex-1 flex flex-col">
              {children}
            </main>
          </div>
        </ThemeProvider>
        <Script src="https://cdn.jsdelivr.net/npm/@mux/mux-player" strategy="beforeInteractive" />
      </body>
    </html>
  )
}
