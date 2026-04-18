import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-nextauth'
import NGODashboardClient from './client'

export default async function NGODashboard() {
  // Protect this page - only NGO role can access
  const session = await getServerSession(authOptions)
  
  if (!session?.user || (session.user as any).role !== 'NGO') {
    redirect('/unauthorized')
  }

  return <NGODashboardClient user={session.user} />
}
