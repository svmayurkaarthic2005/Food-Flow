'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { performCompleteLogout } from '@/lib/auth'

interface User {
  id: string
  email: string
  name: string
  role: string
  donorId?: string
  ngoId?: string
  adminId?: string
  isVerified?: boolean
  status?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true)
      setUser(null)
    } else if (session?.user) {
      setLoading(false)
      setUser({
        id: (session.user as any).id,
        email: (session.user as any).email,
        name: (session.user as any).name,
        role: (session.user as any).role,
        donorId: (session.user as any).donorId,
        ngoId: (session.user as any).ngoId,
        adminId: (session.user as any).adminId,
        isVerified: (session.user as any).isVerified,
        status: (session.user as any).status,
      })
    } else {
      setLoading(false)
      setUser(null)
    }
  }, [session, status])

  const login = async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        throw new Error(result.error)
      }
      
      // Wait for session to update
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Get the updated session to determine role
      const response = await fetch('/api/auth/session')
      const sessionData = await response.json()
      
      if (sessionData?.user?.role) {
        const role = sessionData.user.role
        const dashboardPath = role === 'ADMIN' ? '/admin' : role === 'NGO' ? '/ngo' : '/donor'
        router.push(dashboardPath)
      } else {
        router.push('/donor') // Default fallback
      }
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      
      // Use NextAuth signOut first
      await signOut({ redirect: false })
      
      // Then perform complete logout to clear all session data
      await performCompleteLogout()
      
      // Clear user state
      setUser(null)
      
      // The performCompleteLogout function will handle the redirect
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback: still try to clear data and redirect
      setUser(null)
      await performCompleteLogout()
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    // NextAuth handles session refresh automatically
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
