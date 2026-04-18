import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth'

export async function POST() {
  try {
    const cookie = clearAuthCookie()
    const response = NextResponse.json({ success: true })
    
    // Clear the main auth cookie
    response.cookies.set(cookie)
    
    // Clear NextAuth session cookies (these are the critical ones for OAuth)
    response.cookies.set('next-auth.session-token', '', { 
      maxAge: 0, 
      path: '/',
      httpOnly: true,
      sameSite: 'lax'
    })
    response.cookies.set('__Secure-next-auth.session-token', '', { 
      maxAge: 0, 
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    })
    response.cookies.set('next-auth.csrf-token', '', { 
      maxAge: 0, 
      path: '/',
      httpOnly: true,
      sameSite: 'lax'
    })
    response.cookies.set('__Host-next-auth.csrf-token', '', { 
      maxAge: 0, 
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    })
    response.cookies.set('next-auth.callback-url', '', { 
      maxAge: 0, 
      path: '/',
      sameSite: 'lax'
    })
    
    // Clear any other potential auth-related cookies
    response.cookies.set('session', '', { maxAge: 0, path: '/' })
    response.cookies.set('token', '', { maxAge: 0, path: '/' })
    response.cookies.set('refresh-token', '', { maxAge: 0, path: '/' })
    
    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, private')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Clear-Site-Data', '"cache", "cookies", "storage"')
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ success: false, error: 'Logout failed' }, { status: 500 })
  }
}
