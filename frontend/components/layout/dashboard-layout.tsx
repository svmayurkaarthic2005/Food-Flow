'use client'

import { useEffect, useState } from 'react'
import { Header } from './header'
import { Sidebar } from './sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  role?: string
}

export function DashboardLayout({ children, role = 'DONOR' }: DashboardLayoutProps) {
  const [userRole, setUserRole] = useState(role)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setUserRole(data.user.role)
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
      }
    }

    fetchUser()
  }, [])

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={userRole} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
