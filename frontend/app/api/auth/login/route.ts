import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { createToken, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
        role: true,
        status: true,
        avatar: true,
        emailVerified: true,
        donorProfile: true,
        ngoProfile: true,
        adminProfile: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash || '')

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user is verified
    if (user.status !== 'VERIFIED') {
      return NextResponse.json(
        { error: 'Account not verified. Please contact support.' },
        { status: 403 }
      )
    }

    // Create JWT token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      donorId: user.donorProfile?.id,
      ngoId: user.ngoProfile?.id,
      adminId: user.adminProfile?.id,
    })

    // Set cookie
    const cookie = setAuthCookie(token)
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          donorId: user.donorProfile?.id,
          ngoId: user.ngoProfile?.id,
          adminId: user.adminProfile?.id,
        },
      },
      { status: 200 }
    )

    response.cookies.set(cookie)

    return response
  } catch (error) {
    console.error('Login error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Login failed'
    return NextResponse.json(
      { error: errorMessage || 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}
