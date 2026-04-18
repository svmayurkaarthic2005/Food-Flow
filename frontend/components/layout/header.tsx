'use client'

import { UserMenu } from './user-menu'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import Link from 'next/link'

interface HeaderProps {
  showMenu?: boolean
}

export function Header({ showMenu = true }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">FF</span>
          </div>
          <span className="font-bold text-lg hidden sm:inline">FoodFlow</span>
        </Link>

        {showMenu && <UserMenu />}
      </div>
    </header>
  )
}
