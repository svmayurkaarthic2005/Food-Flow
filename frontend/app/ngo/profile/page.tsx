'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { AddressAutocompleteInput } from '@/components/forms/address-autocomplete-input'
import { LocationPickerMap } from '@/components/forms/location-picker-map'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Mail, User, MapPin, Phone, Heart } from 'lucide-react'
import Link from 'next/link'

export default function NGOProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [ngo, setNGO] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    organizationName: '',
    phone: '',
    address: '',
    latitude: 0,
    longitude: 0,
    storageCapacity: 0,
  })

  const handleLocationChange = useCallback(({ latitude, longitude, address }: any) => {
    setFormData((prev) => ({
      ...prev,
      latitude,
      longitude,
      address: address || prev.address,
    }))
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setUser(data)

          if (data.ngoId) {
            const ngoRes = await fetch(`/api/ngos/${data.ngoId}`)
            if (ngoRes.ok) {
              const ngoData = await ngoRes.json()
              setNGO(ngoData)
              setFormData({
                name: data.name,
                organizationName: ngoData.organizationName,
                phone: ngoData.phone || '',
                address: ngoData.address,
                latitude: ngoData.latitude ?? 0,
                longitude: ngoData.longitude ?? 0,
                storageCapacity: ngoData.storageCapacity,
              })
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleSave = async () => {
    if (!ngo?.id) {
      toast({
        title: 'Profile not ready',
        description: 'NGO profile is missing. Please sign in again.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/ngos/${ngo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: formData.organizationName,
          phone: formData.phone,
          address: formData.address,
          latitude: Number.isFinite(formData.latitude) ? formData.latitude : 0,
          longitude: Number.isFinite(formData.longitude) ? formData.longitude : 0,
          storageCapacity: Number.isFinite(formData.storageCapacity) ? formData.storageCapacity : 0,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData?.error || 'Failed to save profile')
      }

      const updated = await response.json()
      setNGO(updated)
      setFormData((prev) => ({
        ...prev,
        organizationName: updated.organizationName || '',
        phone: updated.phone || '',
        address: updated.address || '',
        latitude: updated.latitude ?? prev.latitude,
        longitude: updated.longitude ?? prev.longitude,
        storageCapacity: updated.storageCapacity ?? prev.storageCapacity,
      }))
      setEditing(false)
      toast({
        title: 'Profile updated',
        description: 'Your NGO profile changes were saved.',
      })
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Could not save profile changes.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">NGO Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your organization information</p>
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Information</CardTitle>
          <CardDescription>Your NGO account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                <Heart className="w-8 h-8 text-success" />
              </div>
            )}
            <div>
              <p className="font-semibold text-foreground">{user?.name}</p>
              <p className="text-sm text-muted-foreground">NGO Organization</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Contact Name</label>
              <Input
                value={formData.name}
                disabled
                className="mt-2 bg-secondary/30"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Organization Name</label>
              <Input
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                disabled={!editing}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!editing}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Address</label>
              <AddressAutocompleteInput
                value={formData.address}
                onValueChange={(address) =>
                  setFormData((prev) => ({
                    ...prev,
                    address,
                  }))
                }
                onPlaceSelect={({ address, latitude, longitude }) =>
                  setFormData((prev) => ({
                    ...prev,
                    address,
                    latitude: latitude ?? prev.latitude,
                    longitude: longitude ?? prev.longitude,
                  }))
                }
                disabled={!editing}
                className="mt-2"
                placeholder="Select address from Google Maps"
              />
              {editing && (
                <p className="text-xs text-muted-foreground mt-1">
                  Tip: choose an address from suggestions for accurate map location.
                </p>
              )}
              {editing && (
                <>
                  <p className="text-xs text-muted-foreground mt-2">
                    Or drag the pin / click map to set location.
                  </p>
                  <LocationPickerMap
                    latitude={formData.latitude}
                    longitude={formData.longitude}
                    onLocationChange={handleLocationChange}
                  />
                </>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Storage Capacity (kg)</label>
              <Input
                type="number"
                value={formData.storageCapacity}
                onChange={(e) => setFormData({ ...formData, storageCapacity: parseInt(e.target.value) })}
                disabled={!editing}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="mt-2 flex items-center gap-2 px-3 py-2 border border-border rounded-md bg-secondary/30">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{user?.email}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
            <div>
              <p className="text-sm text-muted-foreground">Total Received</p>
              <p className="text-2xl font-bold text-foreground mt-1">{ngo?.totalReceived || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">People Served</p>
              <p className="text-2xl font-bold text-success mt-1">{ngo?.peopleServed || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rating</p>
              <p className="text-2xl font-bold text-primary mt-1">{ngo?.rating || 0}★</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            {!editing ? (
              <Button onClick={() => setEditing(true)}>Edit Profile</Button>
            ) : (
              <>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
