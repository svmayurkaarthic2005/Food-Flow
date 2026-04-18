'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  User,
  MapPin,
  BarChart3,
  Network,
  Zap,
  LogOut,
  Truck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: string
}

interface SidebarProps {
  role?: string
}

export function Sidebar({ role = 'DONOR' }: SidebarProps) {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [navItems, setNavItems] = useState<NavItem[]>([])
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await signOut({ redirect: true, callbackUrl: '/' })
    } catch (error) {
      console.error('Logout failed:', error)
      setIsLoggingOut(false)
    }
  }

  useEffect(() => {
    const items: Record<string, NavItem[]> = {
      ADMIN: [
        { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: 'Users', href: '/admin/users', icon: <Users className="w-4 h-4" /> },
        { label: 'Listings', href: '/admin/listings', icon: <FileText className="w-4 h-4" /> },
        { label: 'Assign Driver', href: '/admin/assign-driver', icon: <Truck className="w-4 h-4" /> },
        { label: 'Deliveries', href: '/admin/deliveries', icon: <Truck className="w-4 h-4" /> },
        { label: 'Analytics', href: '/admin/analytics', icon: <BarChart3 className="w-4 h-4" /> },
        { label: 'Network', href: '/admin/network', icon: <Network className="w-4 h-4" /> },
        { label: 'ML Insights', href: '/admin/ml-insights', icon: <Zap className="w-4 h-4" /> },
        { label: 'Profile', href: '/admin/profile', icon: <User className="w-4 h-4" /> },
      ],
      DONOR: [
        { label: 'Dashboard', href: '/donor', icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: 'Create Listing', href: '/donor/create', icon: <FileText className="w-4 h-4" /> },
        { label: 'My Listings', href: '/donor/listings', icon: <MapPin className="w-4 h-4" /> },
        { label: 'Claims', href: '/donor/claims', icon: <Users className="w-4 h-4" /> },
        { label: 'History', href: '/donor/history', icon: <BarChart3 className="w-4 h-4" /> },
        { label: 'Profile', href: '/donor/profile', icon: <User className="w-4 h-4" /> },
      ],
      NGO: [
        { label: 'Dashboard', href: '/ngo', icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: 'Available Listings', href: '/ngo/listings', icon: <FileText className="w-4 h-4" /> },
        { label: 'Claimed Items', href: '/ngo/claimed', icon: <Users className="w-4 h-4" /> },
        { label: 'Deliveries', href: '/ngo/deliveries', icon: <Truck className="w-4 h-4" /> },
        { label: 'Forecasts', href: '/ngo/forecasts', icon: <BarChart3 className="w-4 h-4" /> },
        { label: 'Profile', href: '/ngo/profile', icon: <User className="w-4 h-4" /> },
      ],
    }

    setNavItems(items[role] || items.DONOR)
  }, [role])

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-border bg-secondary/30">
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge && (
              <span className="ml-auto inline-flex items-center rounded-full bg-primary/20 px-2 py-1 text-xs font-medium text-primary">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
      
      {/* User Profile Section */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="flex items-center gap-3">
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt={session?.user?.name || 'User'}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {session?.user?.name || 'User'}
            </p>
            <p className="text-xs text-muted-foreground">
              {(session?.user as any)?.role || role} Account
            </p>
          </div>
        </div>
        
        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          disabled={isLoggingOut}
          variant="outline"
          className="w-full justify-start gap-2"
          size="sm"
        >
          <LogOut className="w-4 h-4" />
          <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
        </Button>
      </div>
    </aside>
  )
}
