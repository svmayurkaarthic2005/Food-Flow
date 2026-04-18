'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { authOptions } from '@/lib/auth-nextauth'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {children}
    </ThemeProvider>
  )
}
