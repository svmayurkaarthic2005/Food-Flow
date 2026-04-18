'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2, Clock, MapPin, Package, ArrowRight, ChevronLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createListing } from '@/lib/api'
import { toast } from 'sonner'

export default function CreateDonationPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [step, setStep] = useState<'details' | 'summary'>('details')
  const [submitting, setSubmitting] = useState(false)
  const [donorProfile, setDonorProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: 'kg',
    address: '',
    latitude: 0,
    longitude: 0,
    expiresIn: '',
    description: '',
    category: '',
    pickupWindowStart: '09:00',
    pickupWindowEnd: '17:00',
  })

  // Fetch donor profile on mount
  useEffect(() => {
    async function fetchDonorProfile() {
      // Wait for auth to finish loading
      if (authLoading) {
        return
      }

      // If no user after auth loads, redirect to signin
      if (!user) {
        setLoading(false)
        toast.error('Please login to create a listing')
        router.push('/signin')
        return
      }

      try {
        const response = await fetch('/api/auth/me')
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to fetch profile')
        }
        
        const data = await response.json()
        
        if (!data.donor) {
          toast.error('Please complete your donor profile first')
          router.push('/donor/profile')
          return
        }
        
        setDonorProfile(data.donor)
        
        // Pre-fill address from donor profile if available
        if (data.donor?.address) {
          setFormData(prev => ({
            ...prev,
            address: data.donor.address,
            latitude: data.donor.latitude || 0,
            longitude: data.donor.longitude || 0,
          }))
        }
      } catch (error: any) {
        console.error('Error fetching donor profile:', error)
        toast.error(error.message || 'Failed to load profile. Please login again.')
        setTimeout(() => router.push('/signin'), 2000)
      } finally {
        setLoading(false)
      }
    }

    fetchDonorProfile()
  }, [authLoading, user, router])

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a food name')
      return false
    }
    if (!formData.category) {
      toast.error('Please select a category')
      return false
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      toast.error('Please enter a valid quantity')
      return false
    }
    if (!formData.address.trim()) {
      toast.error('Please enter a pickup address')
      return false
    }
    if (!formData.expiresIn || parseInt(formData.expiresIn) <= 0) {
      toast.error('Please enter valid expiry hours')
      return false
    }
    return true
  }

  const handleNext = () => {
    if (!validateForm()) return
    setStep('summary')
  }

  const handleBack = () => {
    setStep('details')
  }

  const handleSubmit = async () => {
    if (!donorProfile?.id) {
      toast.error('Donor profile not found. Please complete your profile first.')
      router.push('/donor/profile')
      return
    }

    try {
      setSubmitting(true)
      
      // Calculate expiry time
      const expiryTime = new Date()
      expiryTime.setHours(expiryTime.getHours() + parseInt(formData.expiresIn))

      await createListing({
        name: formData.name.trim(),
        description: formData.description.trim(),
        quantity: `${formData.quantity} ${formData.unit}`,
        category: formData.category,
        address: formData.address.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        expiryTime: expiryTime.toISOString(),
        pickupWindow: `${formData.pickupWindowStart} - ${formData.pickupWindowEnd}`,
        donorId: donorProfile.id,
      })

      toast.success('Donation posted successfully!')
      router.push('/donor/listings')
    } catch (error: any) {
      console.error('Error creating listing:', error)
      toast.error(error.message || 'Failed to post donation')
      setSubmitting(false)
    }
  }

  // Show loading state while fetching profile
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Create New Donation</h1>
        <p className="text-muted-foreground mt-2">List your surplus food for redistribution</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center max-w-md mb-8">
        {['details', 'summary'].map((s, idx) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors ${
                (step === 'details' && idx === 0) || (step === 'summary' && idx <= 1)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground'
              }`}
            >
              {idx + 1}
            </div>
            {idx < 1 && (
              <div
                className={`h-1 flex-1 mx-2 transition-colors ${
                  step === 'summary' ? 'bg-primary' : 'bg-secondary'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          {step === 'details' && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Donation Details</CardTitle>
                <CardDescription>Tell us about your surplus food</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Food Name *</label>
                  <Input
                    placeholder="e.g., Fresh Bakery Items"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Category *</label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vegetables">Fresh Vegetables</SelectItem>
                      <SelectItem value="Fruits">Fresh Fruits</SelectItem>
                      <SelectItem value="Bakery">Bakery Items</SelectItem>
                      <SelectItem value="Dairy">Dairy Products</SelectItem>
                      <SelectItem value="Shelf-Stable">Packaged Foods</SelectItem>
                      <SelectItem value="Prepared Food">Prepared Meals</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Quantity *</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="e.g., 45"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Unit</label>
                    <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lbs">lbs</SelectItem>
                        <SelectItem value="boxes">boxes</SelectItem>
                        <SelectItem value="items">items</SelectItem>
                        <SelectItem value="servings">servings</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Address *</label>
                  <Input
                    placeholder="Full pickup address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Pickup Window</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Start Time</label>
                      <Input
                        type="time"
                        value={formData.pickupWindowStart}
                        onChange={(e) => handleInputChange('pickupWindowStart', e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">End Time</label>
                      <Input
                        type="time"
                        value={formData.pickupWindowEnd}
                        onChange={(e) => handleInputChange('pickupWindowEnd', e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Expires in (hours) *</label>
                  <Input
                    type="number"
                    min="1"
                    max="72"
                    placeholder="e.g., 6"
                    value={formData.expiresIn}
                    onChange={(e) => handleInputChange('expiresIn', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">How many hours until this food expires?</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <textarea
                    placeholder="Additional details about the food condition, storage, etc."
                    className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground text-sm"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" asChild>
                    <Link href="/donor">Cancel</Link>
                  </Button>
                  <Button className="flex-1 ml-auto" onClick={handleNext}>
                    Review Donation
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'summary' && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Review Your Donation</CardTitle>
                <CardDescription>Confirm the details before posting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-secondary/30 rounded-lg p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Food Name</p>
                      <p className="text-xl font-semibold text-foreground">{formData.name}</p>
                    </div>
                    <Package className="w-6 h-6 text-primary mt-1" />
                  </div>
                  
                  <div className="border-t border-border pt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Quantity</p>
                      <p className="font-semibold text-foreground">{formData.quantity} {formData.unit}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Category</p>
                      <p className="font-semibold text-foreground">{formData.category}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-border pt-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-1">Pickup Address</p>
                        <p className="font-medium text-foreground">{formData.address}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <p className="text-sm text-muted-foreground mb-1">Pickup Window</p>
                    <p className="font-medium text-foreground">{formData.pickupWindowStart} - {formData.pickupWindowEnd}</p>
                  </div>
                  
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                      <Clock className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-red-900 dark:text-red-100">Expires in {formData.expiresIn} hours</p>
                        <p className="text-xs text-red-700 dark:text-red-300">
                          {new Date(Date.now() + parseInt(formData.expiresIn) * 60 * 60 * 1000).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {formData.description && (
                    <div className="border-t border-border pt-4">
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm text-foreground">{formData.description}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    Ready to Post
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your donation will be visible to partner NGOs immediately. They can claim it and arrange pickup.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBack} disabled={submitting} className="gap-2">
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button className="flex-1 ml-auto" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        Post Donation
                        <CheckCircle2 className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Sidebar - Summary Card (Sticky) */}
        <div className="h-fit lg:sticky lg:top-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Donation Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">Food Name</p>
                <p className="text-foreground font-semibold mt-1">
                  {formData.name || '—'}
                </p>
              </div>
              <div className="border-t border-primary/20 pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Quantity</p>
                <p className="text-foreground font-semibold mt-1">
                  {formData.quantity} {formData.unit || '—'}
                </p>
              </div>
              <div className="border-t border-primary/20 pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Category</p>
                <p className="text-foreground font-semibold mt-1">
                  {formData.category || '—'}
                </p>
              </div>
              <div className="border-t border-primary/20 pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Expires In</p>
                <p className="text-foreground font-semibold mt-1">
                  {formData.expiresIn ? `${formData.expiresIn} hours` : '—'}
                </p>
              </div>
              <div className="border-t border-primary/20 pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Pickup Window</p>
                <p className="text-foreground font-semibold mt-1">
                  {formData.pickupWindowStart && formData.pickupWindowEnd 
                    ? `${formData.pickupWindowStart} - ${formData.pickupWindowEnd}` 
                    : '—'}
                </p>
              </div>
              <div className="border-t border-primary/20 pt-4">
                <p className="text-xs text-muted-foreground">
                  Complete all required fields to post your donation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
