'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestOAuthPage() {
  const { data: session, status } = useSession()

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>OAuth Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Status:</p>
            <p className="text-sm text-muted-foreground">{status}</p>
          </div>

          {session ? (
            <>
              <div>
                <p className="text-sm font-medium mb-2">Session Data:</p>
                <pre className="text-xs bg-secondary p-3 rounded overflow-auto max-h-64">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </div>
              <Button onClick={() => signOut()} variant="destructive" className="w-full">
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Not signed in</p>
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    console.log('Test: Calling signIn with google')
                    signIn('google', { callbackUrl: '/test-oauth' })
                  }}
                  className="w-full"
                >
                  Test Google Sign In (signIn function)
                </Button>
                <Button
                  onClick={() => {
                    console.log('Test: Direct redirect to Google OAuth')
                    window.location.href = '/api/auth/signin/google?callbackUrl=/test-oauth'
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Test Google Sign In (Direct URL)
                </Button>
              </div>
            </>
          )}

          <div className="pt-4 border-t">
            <p className="text-xs font-medium mb-2">Environment Check:</p>
            <div className="text-xs space-y-1">
              <p>NEXTAUTH_URL: {process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'Not set (using default)'}</p>
              <p>Google Client ID: {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'Set' : 'Not set'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
