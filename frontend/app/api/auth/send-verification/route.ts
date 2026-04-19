import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// Send verification email via backend email service
async function sendVerificationEmail(email: string, token: string, userName: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`

  try {
    // Call backend email service
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const response = await fetch(`${backendUrl}/api/send-verification-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name: userName,
        verification_url: verificationUrl,
      }),
    })

    if (!response.ok) {
      console.error('Failed to send verification email via backend')
      // Fallback: log to console for development
      console.log(`Verification URL for ${email}: ${verificationUrl}`)
      return false
    }

    console.log(`✅ Verification email sent to ${email}`)
    return true
  } catch (error) {
    console.error('Error sending verification email:', error)
    // Fallback: log to console for development
    console.log(`Verification URL for ${email}: ${verificationUrl}`)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      )
    }

    // Delete any existing verification tokens
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    })

    // Generate new verification token
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create verification token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    })

    // Send verification email
    await sendVerificationEmail(email, token, user.name)

    return NextResponse.json(
      { success: true, message: 'Verification email sent' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Send verification error:', error)
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    )
  }
}
