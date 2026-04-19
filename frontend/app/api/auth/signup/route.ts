import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { createToken, setAuthCookie } from '@/lib/auth'
import crypto from 'crypto'

// Simple email sending function (you would integrate with a real email service)
async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`

  // TODO: Integrate with email service (SendGrid, Resend, etc.)
  console.log(`Verification email would be sent to ${email}`)
  console.log(`Verification URL: ${verificationUrl}`)

  return true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, role, requireEmailVerification = true, ...profileData } = body

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Email, password, name, and role are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user with profile based on role
    let userData: any = {
      email,
      passwordHash,
      name,
      role,
      status: requireEmailVerification ? 'PENDING' : 'VERIFIED',
      emailVerified: requireEmailVerification ? null : new Date(),
    }

    if (role === 'DONOR') {
      userData.donorProfile = {
        create: {
          businessName: profileData.businessName || name,
          businessType: profileData.businessType || 'Other',
          address: profileData.address || '',
          latitude: profileData.latitude || 0,
          longitude: profileData.longitude || 0,
        },
      }
    } else if (role === 'NGO') {
      userData.ngoProfile = {
        create: {
          organizationName: profileData.organizationName || name,
          address: profileData.address || '',
          latitude: profileData.latitude || 0,
          longitude: profileData.longitude || 0,
          storageCapacity: profileData.storageCapacity || 1000,
          peopleServed: profileData.peopleServed || 0,
        },
      }
    } else if (role === 'DRIVER') {
      // Driver role doesn't need a separate profile table
      // Drivers are just users with DRIVER role
      console.log('Creating driver user:', email)
    }

    const user = await prisma.user.create({
      data: userData,
      include: {
        donorProfile: true,
        ngoProfile: true,
        adminProfile: true,
      },
    })

    // If email verification is required, send verification email
    if (requireEmailVerification) {
      const token = crypto.randomBytes(32).toString('hex')
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires,
        },
      })

      await sendVerificationEmail(email, token)

      return NextResponse.json(
        {
          success: true,
          message: 'Account created. Please check your email to verify your account.',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
        { status: 201 }
      )
    }

    // Create JWT token for immediate login (if email verification not required)
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
      { status: 201 }
    )

    response.cookies.set(cookie)

    return response
  } catch (error) {
    console.error('Signup error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Signup failed'
    return NextResponse.json(
      { error: errorMessage || 'Signup failed. Please try again.' },
      { status: 500 }
    )
  }
}
