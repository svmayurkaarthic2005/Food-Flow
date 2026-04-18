import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-nextauth'
import AdminDashboardClient from './client'

export default async function AdminDashboard() {
  // Protect this page - only ADMIN role can access
  const session = await getServerSession(authOptions)
  
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  return <AdminDashboardClient user={session.user} />
}
