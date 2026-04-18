'use client'

import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'

export default function DonorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar role="DONOR" />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
