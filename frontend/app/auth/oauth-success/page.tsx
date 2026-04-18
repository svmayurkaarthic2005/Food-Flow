'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

function getDashboardPath(role?: string) {
  if (role === 'ADMIN') return '/admin'
  if (role === 'NGO') return '/ngo'
  return '/donor'
}

export default function OAuthSuccessPage() {
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const finalizeOAuth = async () => {
      // Wait for session to load
      if (status === 'loading' || processing) return

      if (status === 'unauthenticated') {
        setError('Authentication failed. Please try again.')
        setTimeout(() => router.push('/signin'), 2000)
        return
      }

      if (status === 'authenticated' && session?.user) {
        setProcessing(true)
        
        try {
          const user = session.user as any
          
          // Get pending role from localStorage
          const pendingRole = localStorage.getItem('pendingOAuthRole')
          
          // Check if user needs role assignment (status is PENDING or no role)
          const needsRoleSetup = user.status === 'PENDING' || !user.role || user.role === 'DONOR' && !user.donorId || user.role === 'NGO' && !user.ngoId

          if (needsRoleSetup && pendingRole) {
            console.log('Setting up role:', pendingRole)
            
            // Complete profile with the selected role
            const completeRes = await fetch('/api/auth/complete-profile', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role: pendingRole }),
            })

            if (!completeRes.ok) {
              const errorData = await completeRes.json()
              throw new Error(errorData.error || 'Failed to initialize role profile')
            }

            // Update the session to get the new role
            await update()
            
            // Wait a bit for the session to update
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            // Clean up localStorage
            localStorage.removeItem('pendingOAuthRole')
            
            // Redirect to the appropriate dashboard based on the new role
            const dashboardPath = getDashboardPath(pendingRole)
            console.log('Redirecting to:', dashboardPath)
            window.location.href = dashboardPath // Use hard redirect to ensure clean state
          } else {
            // User already has a role, redirect to their dashboard
            console.log('User has role:', user.role)
            localStorage.removeItem('pendingOAuthRole')
            const dashboardPath = getDashboardPath(user.role)
            console.log('Redirecting to:', dashboardPath)
            window.location.href = dashboardPath // Use hard redirect to ensure clean state
          }
        } catch (err) {
          console.error('OAuth finalization error:', err)
          const message = err instanceof Error ? err.message : 'Setup failed'
          setError(message)
          setTimeout(() => router.push('/signin'), 2000)
        } finally {
          setProcessing(false)
        }
      }
    }

    finalizeOAuth()
  }, [router, session, status, update, processing])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center space-y-3 max-w-md">
        {error ? (
          <>
            <h1 className="text-2xl font-semibold text-destructive">Error</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-xs text-muted-foreground">Redirecting to sign in...</p>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Finishing sign in...</h1>
            <p className="text-sm text-muted-foreground">
              Setting up your account and redirecting to your dashboard.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

