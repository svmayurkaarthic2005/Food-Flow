'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'

export function UserMenu() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setUser(data)
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint
      await fetch('/api/auth/logout', { method: 'POST' })
      
      // Clear all session data from browser
      const { clearAllSessionData } = await import('@/lib/auth')
      clearAllSessionData()
      
      // Redirect to signin
      router.push('/signin')
      
      // Force page reload to ensure all state is cleared
      window.location.reload()
    } catch (error) {
      console.error('Logout failed:', error)
      // Still redirect even if logout fails
      router.push('/signin')
    }
  }

  const getProfileLink = () => {
    if (!user?.role) {
      if (pathname?.startsWith('/admin')) return '/admin/profile'
      if (pathname?.startsWith('/ngo')) return '/ngo/profile'
      if (pathname?.startsWith('/donor')) return '/donor/profile'
      return '/signin'
    }

    switch (user?.role) {
      case 'ADMIN':
        return '/admin/profile'
      case 'DONOR':
        return '/donor/profile'
      case 'NGO':
        return '/ngo/profile'
      default:
        return '/donor/profile'
    }
  }

  const getSettingsLink = () => {
    if (!user?.role) {
      if (pathname?.startsWith('/admin')) return '/admin/settings'
      if (pathname?.startsWith('/ngo')) return '/ngo/settings'
      if (pathname?.startsWith('/donor')) return '/donor/settings'
      return '/signin'
    }

    switch (user?.role) {
      case 'ADMIN':
        return '/admin/settings'
      case 'DONOR':
        return '/donor/settings'
      case 'NGO':
        return '/ngo/settings'
      default:
        return '/donor/settings'
    }
  }

  const initials = (user?.name || 'User')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {loading ? '...' : initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col space-y-1 p-2">
          <p className="text-sm font-medium text-foreground">{user?.name || 'User'}</p>
          <p className="text-xs text-muted-foreground">{user?.email || 'Not signed in'}</p>
          <p className="text-xs text-muted-foreground font-medium">{user?.role || 'GUEST'}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={getProfileLink()} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={getSettingsLink()} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive cursor-pointer"
          disabled={!user}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
