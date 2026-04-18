import { NextRequest, NextResponse } from 'next/server';

// Email templates
const getEmailTemplate = (type: string, data: any) => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  if (type === 'DRIVER') {
    return {
      subject: `New Delivery Assignment - ${data.itemName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚚 New Delivery Assignment</h1>
            </div>
            <div class="content">
              <p>Hi ${data.driverName},</p>
              <p>You have been assigned a new delivery!</p>
              
              <div class="details">
                <h3>Delivery Details:</h3>
                <p><strong>Item:</strong> ${data.itemName}</p>
                <p><strong>Pickup From:</strong> ${data.donorName}</p>
                <p><strong>Pickup Address:</strong> ${data.pickupAddress}</p>
                <p><strong>Deliver To:</strong> ${data.ngoName}</p>
                <p><strong>Delivery Address:</strong> ${data.deliveryAddress}</p>
              </div>

              <p>Please start the delivery as soon as possible.</p>
              
              <a href="${baseUrl}/driver/tracking?id=${data.deliveryId}" class="button">
                Start Delivery Tracking
              </a>

              <p>Thank you for being part of FoodFlow!</p>
            </div>
            <div class="footer">
              <p>FoodFlow - Reducing Food Waste, Feeding Communities</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  }

  if (type === 'NGO') {
    return {
      subject: `Driver Assigned for Your Food Delivery - ${data.itemName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #2196F3; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📦 Driver Assigned to Your Delivery</h1>
            </div>
            <div class="content">
              <p>Good news! A driver has been assigned to deliver your food donation.</p>
              
              <div class="details">
                <h3>Delivery Information:</h3>
                <p><strong>Item:</strong> ${data.itemName}</p>
                <p><strong>From:</strong> ${data.donorName}</p>
                <p><strong>Driver:</strong> ${data.driverName}</p>
                <p><strong>Driver Contact:</strong> ${data.driverEmail}</p>
              </div>

              <p>You can track the delivery in real-time once the driver starts.</p>
              
              <a href="${baseUrl}/ngo/tracking?id=${data.deliveryId}" class="button">
                Track Delivery Live
              </a>

              <p>Thank you for using FoodFlow!</p>
            </div>
            <div class="footer">
              <p>FoodFlow - Reducing Food Waste, Feeding Communities</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  }

  if (type === 'DONOR') {
    return {
      subject: `Your Food Donation is Being Delivered - ${data.itemName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; }
            .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #FF9800; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Your Donation is On Its Way!</h1>
            </div>
            <div class="content">
              <p>Great news! A driver has been assigned to pick up your food donation.</p>
              
              <div class="details">
                <h3>Delivery Details:</h3>
                <p><strong>Item:</strong> ${data.itemName}</p>
                <p><strong>Delivering To:</strong> ${data.ngoName}</p>
                <p><strong>Driver:</strong> ${data.driverName}</p>
                <p><strong>Pickup Address:</strong> ${data.pickupAddress}</p>
              </div>

              <p>Please ensure the food is ready for pickup. The driver will arrive soon.</p>

              <p>Thank you for your generous donation and for helping reduce food waste!</p>
            </div>
            <div class="footer">
              <p>FoodFlow - Reducing Food Waste, Feeding Communities</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  }

  return { subject: '', html: '' };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, type, ...data } = body;

    if (!to || !type) {
      return NextResponse.json(
        { error: 'to and type are required' },
        { status: 400 }
      );
    }

    const { subject, html } = getEmailTemplate(type, data);

    // In production, integrate with email service (SendGrid, Resend, etc.)
    console.log('📧 Email would be sent:');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Type:', type);
    console.log('Data:', data);

    // TODO: Integrate with actual email service
    // Example with SendGrid:
    // await sendgrid.send({
    //   to,
    //   from: 'noreply@foodflow.com',
    //   subject,
    //   html,
    // });

    return NextResponse.json({
      success: true,
      message: 'Email notification sent',
      preview: { to, subject, type },
    });
  } catch (error) {
    console.error('Error sending email notification:', error);
    return NextResponse.json(
      { error: 'Failed to send email notification' },
      { status: 500 }
    );
  }
}
