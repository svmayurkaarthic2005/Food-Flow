'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Leaf, CheckCircle } from 'lucide-react'
import Link from 'next/link'

function AuthSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('token')
    
    if (!token) {
      setError('No authentication token received')
      setLoading(false)
      return
    }

    // Store the token
    document.cookie = `auth-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; secure=${process.env.NODE_ENV === 'production'}; sameSite=lax`
    
    // Redirect to dashboard after a short delay
    setTimeout(() => {
      router.push('/donor')
    }, 2000)
  }, [searchParams, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-12 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
            <h2 className="text-xl font-semibold">Authenticating...</h2>
            <p className="text-muted-foreground">Setting up your session</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-12 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-destructive rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-destructive-foreground" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-destructive">Authentication Failed</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button asChild>
              <Link href="/signin">Try Again</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-12 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-10 h-10 bg-success rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-foreground" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-success">Authentication Successful!</h2>
          <p className="text-muted-foreground">Redirecting you to your dashboard...</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-12 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
            <h2 className="text-xl font-semibold">Loading...</h2>
          </CardContent>
        </Card>
      </div>
    }>
      <AuthSuccessContent />
    </Suspense>
  )
}
