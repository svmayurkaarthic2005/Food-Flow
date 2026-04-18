import { jwtVerify, SignJWT } from 'jose'
import { NextRequest } from 'next/server'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
)

export interface JWTPayload {
  userId: string
  email: string
  role: string
  donorId?: string
  ngoId?: string
  adminId?: string
  [key: string]: any // Add index signature to match jose JWT type
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch (error) {
    return null
  }
}

export async function getSessionFromRequest(request: NextRequest): Promise<JWTPayload | null> {
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    return null
  }

  return await verifyToken(token)
}

export function setAuthCookie(token: string) {
  return {
    name: 'auth-token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  }
}

export function clearAuthCookie() {
  return {
    name: 'auth-token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  }
}

export function clearAllSessionData() {
  if (typeof window === 'undefined') return
  
  // Clear localStorage
  localStorage.clear()
  
  // Clear sessionStorage
  sessionStorage.clear()
  
  // Clear IndexedDB (used by some auth libraries)
  if (window.indexedDB) {
    try {
      window.indexedDB.databases().then((databases) => {
        databases.forEach((db) => {
          if (db.name) {
            window.indexedDB.deleteDatabase(db.name)
          }
        })
      })
    } catch (e) {
      console.warn('Could not clear IndexedDB:', e)
    }
  }
  
  // List of all possible cookie names to clear
  const cookiesToClear = [
    'auth-token',
    'session',
    'token',
    'refresh-token',
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.csrf-token',
    '__Host-next-auth.csrf-token',
    'next-auth.callback-url',
    '__Secure-next-auth.callback-url',
  ]
  
  // Clear specific cookies
  cookiesToClear.forEach(cookieName => {
    // Clear for current domain
    document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
    
    // Clear for parent domain (e.g., .example.com)
    const domainParts = window.location.hostname.split('.')
    if (domainParts.length > 1) {
      const parentDomain = '.' + domainParts.slice(-2).join('.')
      document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${parentDomain}`
    }
    
    // Clear with secure flag for HTTPS
    if (window.location.protocol === 'https:') {
      document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;secure`
      document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname};secure`
    }
  })
  
  // Clear any remaining cookies that contain auth-related keywords
  document.cookie.split(';').forEach(cookie => {
    const eqPos = cookie.indexOf('=')
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
    
    if (name && (name.includes('auth') || name.includes('token') || name.includes('session'))) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
      
      const domainParts = window.location.hostname.split('.')
      if (domainParts.length > 1) {
        const parentDomain = '.' + domainParts.slice(-2).join('.')
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${parentDomain}`
      }
    }
  })
}

export async function performCompleteLogout() {
  try {
    // Call logout API
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })
    
    // Clear all client-side data regardless of API response
    clearAllSessionData()
    
    // Force reload to clear any cached state
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
    
    return response.ok
  } catch (error) {
    console.error('Logout error:', error)
    // Still clear client-side data even if API fails
    clearAllSessionData()
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
    return false
  }
}
