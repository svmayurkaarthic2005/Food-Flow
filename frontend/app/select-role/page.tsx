'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Heart, Shield, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function SelectRolePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'DONOR' | 'NGO' | null>(null)

  const handleRoleSelection = async (role: 'DONOR' | 'NGO') => {
    if (!user || authLoading) return
    setSubmitting(true)
    setSelectedRole(role)

    try {
      // Update database and Clerk metadata via API
      const response = await fetch('/api/users/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update role')
      }

      toast.success(`Welcome! You're now registered as a ${role === 'DONOR' ? 'Donor' : 'NGO'}`)

      // Redirect to appropriate dashboard
      const dashboardMap = {
        DONOR: '/donor',
        NGO: '/ngo',
      }

      router.push(dashboardMap[role])
    } catch (error) {
      console.error('Error selecting role:', error)
      toast.error('Failed to set role. Please try again.')
      setSubmitting(false)
      setSelectedRole(null)
    }
  }

  // Show loading state while auth initializes
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to signin if not signed in
  if (!user) {
    router.push('/signin')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Choose Your Role</h1>
          <p className="text-lg text-muted-foreground">
            Select how you'd like to participate in FoodFlow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Donor Card */}
          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedRole === 'DONOR' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => !authLoading && !submitting && handleRoleSelection('DONOR')}
          >
            <CardHeader>
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Food Donor</CardTitle>
              <CardDescription className="text-base">
                I have surplus food to donate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>List surplus food items for donation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Track donation history and impact</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Connect with local NGOs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Reduce food waste and help the community</span>
                </li>
              </ul>
              <Button 
                className="w-full mt-6" 
                disabled={submitting}
                onClick={(e) => {
                  e.stopPropagation()
                  handleRoleSelection('DONOR')
                }}
              >
                {submitting && selectedRole === 'DONOR' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'Continue as Donor'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* NGO Card */}
          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedRole === 'NGO' ? 'ring-2 ring-success' : ''
            }`}
            onClick={() => !authLoading && !submitting && handleRoleSelection('NGO')}
          >
            <CardHeader>
              <div className="w-16 h-16 bg-success/10 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-success" />
              </div>
              <CardTitle className="text-2xl">NGO / Charity</CardTitle>
              <CardDescription className="text-base">
                I collect food to help those in need
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  <span>Browse and claim available food donations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  <span>AI-powered route optimization</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  <span>Real-time delivery tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  <span>Manage capacity and distribution</span>
                </li>
              </ul>
              <Button 
                className="w-full mt-6 bg-success hover:bg-success/90" 
                disabled={submitting}
                onClick={(e) => {
                  e.stopPropagation()
                  handleRoleSelection('NGO')
                }}
              >
                {submitting && selectedRole === 'NGO' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'Continue as NGO'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>You can change your role later in settings</p>
        </div>
      </div>
    </div>
  )
}
