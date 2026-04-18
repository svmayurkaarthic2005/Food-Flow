import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-nextauth';
import { prisma } from '@/lib/prisma';

// Email notification function
async function sendDeliveryAssignmentEmails(delivery: any) {
  try {
    const emailData = {
      deliveryId: delivery.id,
      itemName: delivery.claim.listing.name,
      pickupAddress: delivery.claim.listing.address,
      deliveryAddress: delivery.ngo.address,
      driverName: delivery.driver.name,
      driverEmail: delivery.driver.email,
      donorName: delivery.claim.listing.donor.businessName,
      ngoName: delivery.ngo.organizationName,
    };

    // Send email to driver
    await fetch(`${process.env.NEXTAUTH_URL}/api/notifications/delivery-assigned`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: delivery.driver.email,
        type: 'DRIVER',
        ...emailData,
      }),
    });

    // Send email to NGO
    const ngoUser = await prisma.user.findUnique({
      where: { id: delivery.ngo.userId },
    });
    if (ngoUser) {
      await fetch(`${process.env.NEXTAUTH_URL}/api/notifications/delivery-assigned`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: ngoUser.email,
          type: 'NGO',
          ...emailData,
        }),
      });
    }

    // Send email to donor
    const donorUser = await prisma.user.findUnique({
      where: { id: delivery.claim.listing.donor.userId },
    });
    if (donorUser) {
      await fetch(`${process.env.NEXTAUTH_URL}/api/notifications/delivery-assigned`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: donorUser.email,
          type: 'DONOR',
          ...emailData,
        }),
      });
    }

    console.log('✓ Delivery assignment emails sent');
  } catch (error) {
    console.error('Error sending emails:', error);
    // Don't fail the assignment if email fails
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access only' }, { status: 403 });
    }

    const body = await request.json();
    const { claimId, driverId } = body;

    if (!claimId || !driverId) {
      return NextResponse.json(
        { error: 'claimId and driverId are required' },
        { status: 400 }
      );
    }

    // Verify claim exists and is accepted
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        listing: {
          include: {
            donor: true,
          },
        },
        ngo: true,
        delivery: true,
      },
    });

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    if (claim.status !== 'ACCEPTED') {
      return NextResponse.json({ error: 'Claim must be accepted first' }, { status: 400 });
    }

    if (claim.delivery) {
      return NextResponse.json({ error: 'Delivery already assigned' }, { status: 400 });
    }

    // Verify driver exists
    const driver = await prisma.user.findUnique({
      where: { id: driverId },
    });

    if (!driver || driver.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Invalid driver' }, { status: 400 });
    }

    // Create delivery
    const delivery = await prisma.delivery.create({
      data: {
        claimId: claimId,
        driverId: driverId,
        ngoId: claim.ngoId,
        status: 'PENDING',
      },
      include: {
        claim: {
          include: {
            listing: {
              include: {
                donor: true,
              },
            },
            ngo: true,
          },
        },
        driver: true,
        ngo: true,
      },
    });

    // Send email notifications to all parties
    await sendDeliveryAssignmentEmails(delivery);

    return NextResponse.json({
      success: true,
      delivery: {
        id: delivery.id,
        status: delivery.status,
        driverName: delivery.driver.name,
        itemName: delivery.claim.listing.name,
      },
      message: 'Driver assigned successfully. Notifications sent to driver, NGO, and donor.',
    });
  } catch (error) {
    console.error('Error assigning driver:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
