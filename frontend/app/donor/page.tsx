import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-nextauth'
import DonorDashboardClient from './client'

export default async function DonorDashboard() {
  // Protect this page - only DONOR role can access
  const session = await getServerSession(authOptions)
  
  if (!session?.user || (session.user as any).role !== 'DONOR') {
    redirect('/unauthorized')
  }

  return <DonorDashboardClient user={session.user} />
}
