'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  const token = searchParams.get('token')
  const email = searchParams.get('email')

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token || !email) {
        setStatus('error')
        setMessage('Invalid verification link')
        return
      }

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, email }),
        })

        if (response.ok) {
          setStatus('success')
          setMessage('Email verified successfully! Redirecting to login...')
          setTimeout(() => router.push('/signin'), 3000)
        } else {
          const data = await response.json()
          setStatus('error')
          setMessage(data.error || 'Failed to verify email')
        }
      } catch (error) {
        setStatus('error')
        setMessage('An error occurred while verifying your email')
      }
    }

    verifyEmail()
  }, [token, email, router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>Verifying your email address</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          {status === 'loading' && (
            <>
              <Loader className="w-12 h-12 text-primary animate-spin" />
              <p className="text-center text-muted-foreground">
                Verifying your email address...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 text-green-500" />
              <div className="text-center space-y-2">
                <p className="font-semibold text-foreground">Email Verified!</p>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
              <Button asChild className="w-full">
                <Link href="/signin">Go to Login</Link>
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="w-12 h-12 text-red-500" />
              <div className="text-center space-y-2">
                <p className="font-semibold text-foreground">Verification Failed</p>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
              <div className="space-y-2 w-full">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/signin">Back to Login</Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/auth/resend-verification">Resend Verification Email</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
