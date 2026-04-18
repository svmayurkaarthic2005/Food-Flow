'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Bell, Lock, Eye, LogOut, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

const DONOR_SETTINGS_KEY = 'foodflow:donor-settings'

export default function DonorSettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [settings, setSettings] = useState({
    emailNotifications: true,
    claimAlerts: true,
    pickupReminders: true,
    locationSharing: false,
    twoFactorAuth: false,
  })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DONOR_SETTINGS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setSettings((prev) => ({ ...prev, ...parsed }))
      }
    } catch (error) {
      console.error('Failed to load donor settings:', error)
    }
  }, [])

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSaveSettings = () => {
    try {
      localStorage.setItem(DONOR_SETTINGS_KEY, JSON.stringify(settings))
      toast({
        title: 'Settings saved',
        description: 'Your donor settings were saved successfully.',
      })
    } catch (error) {
      console.error('Failed to save donor settings:', error)
      toast({
        title: 'Save failed',
        description: 'Could not save settings. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint
      await fetch('/api/auth/logout', { method: 'POST' })
      
      // Clear all session data from browser
      const { clearAllSessionData } = await import('@/lib/auth')
      clearAllSessionData()
      
      // Force navigation to signin
      window.location.href = '/signin'
    } catch (error) {
      console.error('Logout failed:', error)
      toast({
        title: 'Logout failed',
        description: 'Could not sign out. Please try again.',
        variant: 'destructive',
      })
      // Still redirect even if logout fails
      window.location.href = '/signin'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your preferences and security</p>
        </div>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
          <CardDescription>Control how you receive updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive updates via email</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={() => handleToggle('emailNotifications')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Claim Alerts</p>
              <p className="text-sm text-muted-foreground">Get notified when food is claimed</p>
            </div>
            <Switch
              checked={settings.claimAlerts}
              onCheckedChange={() => handleToggle('claimAlerts')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Pickup Reminders</p>
              <p className="text-sm text-muted-foreground">Receive pickup time reminders</p>
            </div>
            <Switch
              checked={settings.pickupReminders}
              onCheckedChange={() => handleToggle('pickupReminders')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Location & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location & Privacy
          </CardTitle>
          <CardDescription>Manage location and privacy settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Location Sharing</p>
              <p className="text-sm text-muted-foreground">Share location with NGOs for pickups</p>
            </div>
            <Switch
              checked={settings.locationSharing}
              onCheckedChange={() => handleToggle('locationSharing')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Security
          </CardTitle>
          <CardDescription>Manage your account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
            </div>
            <Switch
              checked={settings.twoFactorAuth}
              onCheckedChange={() => handleToggle('twoFactorAuth')}
            />
          </div>

          <Button variant="outline" className="w-full justify-start">
            <Eye className="w-4 h-4 mr-2" />
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
