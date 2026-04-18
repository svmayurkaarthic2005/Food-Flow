'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Leaf } from 'lucide-react'

export function MainNav() {
  const { user, loading } = useAuth()

  return (
    <header className="border-b border-border backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Leaf className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl text-foreground">FoodFlow</span>
        </Link>
        
        <div className="flex items-center gap-4">
          {/* Show sign-in button when not signed in */}
          {(!user || loading) ? (
            <Button variant="ghost" asChild>
              <Link href="/signin">Sign In</Link>
            </Button>
          ) : (
            <Button variant="ghost" asChild>
              <Link href="/donor">Dashboard</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
