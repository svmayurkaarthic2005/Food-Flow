'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Leaf, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-10 h-10 bg-warning rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">NGO Request Pending</CardTitle>
          <CardDescription>
            Your NGO verification request is currently under review
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="text-sm font-medium">Request Submitted</span>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-warning" />
              <span className="text-sm font-medium">Under Review</span>
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold">What happens next?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Admin team will review your organization details</li>
              <li>• You'll receive an email notification when approved</li>
              <li>• This typically takes 2-3 business days</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/donor">Return to Donor Dashboard</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/signin">Sign Out</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
