import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-nextauth'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RoleInput = 'DONOR' | 'NGO' | 'DRIVER'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const role = body?.role as RoleInput | undefined

    if (!role || (role !== 'DONOR' && role !== 'NGO' && role !== 'DRIVER')) {
      return NextResponse.json({ error: 'Role must be DONOR, NGO, or DRIVER' }, { status: 400 })
    }

    const jwtSession = await getSessionFromRequest(request)
    const nextAuthSession = await getServerSession(authOptions)
    const nextAuthUser = nextAuthSession?.user as
      | { id?: string; email?: string | null }
      | undefined

    const currentUser =
      (jwtSession
        ? await prisma.user.findUnique({
            where: { id: jwtSession.userId },
            select: {
              id: true,
              email: true,
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
              donorProfile: true,
              ngoProfile: true,
              adminProfile: true,
            },
          })
        : null)

    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        role,
        status: 'VERIFIED',
        emailVerified: currentUser.emailVerified ?? new Date(),
      },
      select: {
        id: true,
        email: true,
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

    if (role === 'DONOR' && !updatedUser.donorProfile) {
      await prisma.donor.create({
        data: {
          userId: updatedUser.id,
          businessName: updatedUser.name || 'Donor Account',
          businessType: 'Other',
          address: '',
          latitude: 0,
          longitude: 0,
        },
      })
    }

    if (role === 'NGO' && !updatedUser.ngoProfile) {
      await prisma.ngo.create({
        data: {
          userId: updatedUser.id,
          organizationName: updatedUser.name || 'NGO Account',
          address: '',
          latitude: 0,
          longitude: 0,
          storageCapacity: 0,
        },
      })
    }

    // DRIVER role doesn't need a separate profile table
    // Drivers are just users with DRIVER role

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Complete profile error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to complete profile'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
