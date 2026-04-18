'use client'

import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function UnauthorizedPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // If no user is logged in, redirect to signin
  useEffect(() => {
    if (isMounted && status === 'unauthenticated') {
      router.push('/signin')
    }
  }, [status, isMounted, router])

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: true, callbackUrl: '/signin' })
    } catch (error) {
      console.error('Logout failed:', error)
      // Force redirect even if logout fails
      window.location.href = '/signin'
    }
  }

  const handleReturnToDashboard = () => {
    if (session?.user) {
      const userRole = (session.user as any)?.role
      const dashboardPath = userRole === 'ADMIN' ? '/admin' : userRole === 'NGO' ? '/ngo' : '/donor'
      router.push(dashboardPath)
    } else {
      router.push('/signin')
    }
  }

  if (!isMounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <p className="font-medium">Why am I seeing this?</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Your account role doesn't have access to this area</li>
              <li>You may need to request NGO access</li>
              <li>Contact support if you believe this is an error</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={handleReturnToDashboard}
              className="w-full"
              variant="default"
            >
              Return to {(session?.user as any)?.role === 'ADMIN' ? 'Admin' : (session?.user as any)?.role === 'NGO' ? 'NGO' : 'Donor'} Dashboard
            </Button>
            <Button 
              onClick={handleSignOut}
              className="w-full"
              variant="outline"
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
