import { ListingStatus } from '@prisma/client'

export interface ListingWithUrgency {
  id: string
  name: string
  description: string
  quantity: string
  category: string
  status: ListingStatus
  address: string
  latitude: number
  longitude: number
  expiryTime: string
  pickupWindow?: string
  hoursRemaining: number
  urgency: 'critical' | 'medium' | 'fresh'
  donor: {
    id: string
    businessName: string
    businessType: string
    user: {
      name: string
    }
  }
}

export interface ListingsResponse {
  data: ListingWithUrgency[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Listings
export async function fetchListings(
  status?: ListingStatus,
  category?: string,
  page: number = 1,
  limit: number = 20,
  donorId?: string
): Promise<ListingsResponse> {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  if (category) params.append('category', category)
  if (donorId) params.append('donorId', donorId)
  params.append('page', page.toString())
  params.append('limit', limit.toString())

  const response = await fetch(`/api/listings?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch listings')
  }
  return response.json()
}

export async function fetchListingById(id: string) {
  const response = await fetch(`/api/listings/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch listing')
  }
  return response.json()
}

export async function createListing(data: {
  name: string
  description: string
  quantity: string
  category: string
  address: string
  latitude: number
  longitude: number
  expiryTime: string
  pickupWindow?: string
  donorId: string
}) {
  const response = await fetch('/api/listings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to create listing')
  }
  return response.json()
}

export async function updateListing(id: string, data: any) {
  const response = await fetch(`/api/listings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to update listing')
  }
  return response.json()
}

export async function deleteListing(id: string) {
  const response = await fetch(`/api/listings/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Failed to delete listing')
  }
  return response.json()
}

// Analytics
export async function fetchDashboardAnalytics(userId?: string, role?: string) {
  const params = new URLSearchParams()
  if (userId) params.append('userId', userId)
  if (role) params.append('role', role)

  const response = await fetch(`/api/analytics/dashboard?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch analytics')
  }
  return response.json()
}

// Users
export async function fetchUsers(
  role?: string,
  page: number = 1,
  limit: number = 20
) {
  const params = new URLSearchParams()
  if (role) params.append('role', role)
  params.append('page', page.toString())
  params.append('limit', limit.toString())

  const response = await fetch(`/api/users?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }
  return response.json()
}

export async function fetchUser(id: string) {
  const response = await fetch(`/api/users/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch user')
  }
  return response.json()
}

export async function updateUser(id: string, data: any) {
  const response = await fetch(`/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to update user')
  }
  return response.json()
}

// Donors
export async function fetchDonor(id: string) {
  const response = await fetch(`/api/donors/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch donor')
  }
  return response.json()
}

export async function updateDonor(id: string, data: any) {
  const response = await fetch(`/api/donors/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to update donor')
  }
  return response.json()
}

// NGOs
export async function fetchNGO(id: string) {
  const response = await fetch(`/api/ngos/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch NGO')
  }
  return response.json()
}

export async function updateNGO(id: string, data: any) {
  const response = await fetch(`/api/ngos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to update NGO')
  }
  return response.json()
}

// Claims
export interface ClaimsResponse {
  data: any[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export async function fetchClaims(
  ngoId?: string,
  donorId?: string,
  status?: string,
  page: number = 1,
  limit: number = 20
): Promise<ClaimsResponse> {
  const params = new URLSearchParams()
  if (ngoId) params.append('ngoId', ngoId)
  if (donorId) params.append('donorId', donorId)
  if (status) params.append('status', status)
  params.append('page', page.toString())
  params.append('limit', limit.toString())

  const response = await fetch(`/api/claims?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch claims')
  }
  return response.json()
}

export async function createClaim(listingId: string, ngoId: string) {
  const response = await fetch('/api/claims', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listingId, ngoId }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create claim')
  }
  return response.json()
}

export async function updateClaimStatus(claimId: string, status: string) {
  const response = await fetch(`/api/claims/${claimId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update claim status')
  }
  return response.json()
}
