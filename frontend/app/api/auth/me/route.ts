import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getSessionFromRequest } from '@/lib/auth'
import { authOptions } from '@/lib/auth-nextauth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    const nextAuthSession = await getServerSession(authOptions)
    const nextAuthUser = nextAuthSession?.user as
      | { id?: string; email?: string | null }
      | undefined

    const user =
      (session
        ? await prisma.user.findUnique({
            where: { id: session.userId },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              status: true,
              avatar: true,
              emailVerified: true,
              createdAt: true,
              updatedAt: true,
              donorProfile: true,
              ngoProfile: true,
              adminProfile: true,
            },
          })
        : null) ??
      (nextAuthUser?.id
        ? await prisma.user.findUnique({
            where: { id: nextAuthUser.id },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              status: true,
              avatar: true,
              emailVerified: true,
              createdAt: true,
              updatedAt: true,
              donorProfile: true,
              ngoProfile: true,
              adminProfile: true,
            },
          })
        : null) ??
      (nextAuthUser?.email
        ? await prisma.user.findUnique({
            where: { email: nextAuthUser.email },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              status: true,
              avatar: true,
              emailVerified: true,
              createdAt: true,
              updatedAt: true,
              donorProfile: true,
              ngoProfile: true,
              adminProfile: true,
            },
          })
        : null)

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      donorId: user.donorProfile?.id,
      ngoId: user.ngoProfile?.id,
      adminId: user.adminProfile?.id,
      donor: user.donorProfile,
      ngo: user.ngoProfile,
      admin: user.adminProfile,
    })
  } catch (error) {
    console.error('Get user error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to get user'
    return NextResponse.json(
      { error: errorMessage || 'Failed to get user' },
      { status: 500 }
    )
  }
}
