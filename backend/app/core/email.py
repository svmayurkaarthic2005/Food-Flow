"""
Email Service
Handles sending emails via Brevo SMTP for notifications and status updates
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from datetime import datetime


# Brevo SMTP Configuration
SMTP_HOST = "smtp-relay.brevo.com"
SMTP_PORT = 587
SMTP_USER = "xsmtpsib-958f6d98327e696d64980048ef4bac947b47efb766bc69b6268260ffa18fae56"
SMTP_PASSWORD = "7xgL3HCYsB46Mgkguse"
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@foodflow.app")
FROM_NAME = "FoodFlow"


class EmailService:
    """Service for sending emails via Brevo SMTP"""
    
    @staticmethod
    def send_email(
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None
    ) -> bool:
        """
        Send email via Brevo SMTP.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML email body
            text_content: Plain text fallback (optional)
            cc: CC recipients (optional)
            bcc: BCC recipients (optional)
            
        Returns:
            True if sent successfully, False otherwise
        """
        try:
            # Create message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
            msg["To"] = to_email
            
            if cc:
                msg["Cc"] = ", ".join(cc)
            
            # Add text and HTML parts
            if text_content:
                msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))
            
            # Prepare recipients
            recipients = [to_email]
            if cc:
                recipients.extend(cc)
            if bcc:
                recipients.extend(bcc)
            
            # Send via SMTP
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(FROM_EMAIL, recipients, msg.as_string())
            
            print(f"✅ Email sent to {to_email}: {subject}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to send email to {to_email}: {str(e)}")
            return False
    
    @staticmethod
    def send_status_update(
        to_email: str,
        status: str,
        title: str,
        message: str,
        details: Optional[dict] = None
    ) -> bool:
        """
        Send status update email.
        
        Args:
            to_email: Recipient email
            status: Status type (success, warning, error, info)
            title: Email title
            message: Main message
            details: Additional details dict
            
        Returns:
            True if sent successfully
        """
        # Color mapping for status
        status_colors = {
            "success": "#10B981",
            "warning": "#F59E0B",
            "error": "#EF4444",
            "info": "#3B82F6"
        }
        
        color = status_colors.get(status, "#6B7280")
        
        # Build HTML content
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <!-- Header -->
                    <div style="background-color: {color}; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h2 style="margin: 0;">{title}</h2>
                        <p style="margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase;">{status}</p>
                    </div>
                    
                    <!-- Content -->
                    <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                        <p>{message}</p>
                        
                        <!-- Details -->
                        {_format_details_html(details) if details else ""}
                        
                        <!-- Footer -->
                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                            <p>Sent at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
                            <p>FoodFlow Platform</p>
                        </div>
                    </div>
                </div>
            </body>
        </html>
        """
        
        # Plain text version
        text_content = f"""
{title}
{status.upper()}

{message}

{_format_details_text(details) if details else ""}

Sent at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}
FoodFlow Platform
        """
        
        return EmailService.send_email(
            to_email=to_email,
            subject=f"[{status.upper()}] {title}",
            html_content=html_content,
            text_content=text_content
        )
    
    @staticmethod
    def send_ml_training_notification(
        to_email: str,
        model_name: str,
        status: str,
        metrics: Optional[dict] = None,
        error_message: Optional[str] = None
    ) -> bool:
        """
        Send ML model training notification.
        
        Args:
            to_email: Recipient email
            model_name: Name of ML model
            status: Training status (started, completed, failed)
            metrics: Training metrics dict
            error_message: Error message if failed
            
        Returns:
            True if sent successfully
        """
        status_map = {
            "started": ("info", "🚀 Training Started"),
            "completed": ("success", "✅ Training Completed"),
            "failed": ("error", "❌ Training Failed")
        }
        
        status_type, title = status_map.get(status, ("info", "ML Training Update"))
        
        message = f"ML model <strong>{model_name}</strong> training has {status}."
        
        if error_message:
            message += f"<br><br><strong>Error:</strong> {error_message}"
        
        return EmailService.send_status_update(
            to_email=to_email,
            status=status_type,
            title=title,
            message=message,
            details=metrics
        )
    
    @staticmethod
    def send_data_collection_report(
        to_email: str,
        report_data: dict
    ) -> bool:
        """
        Send data collection status report.
        
        Args:
            to_email: Recipient email
            report_data: Report data dict with model stats
            
        Returns:
            True if sent successfully
        """
        html_content = """
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <!-- Header -->
                    <div style="background-color: #3B82F6; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h2 style="margin: 0;">📊 Data Collection Report</h2>
                        <p style="margin: 5px 0 0 0; font-size: 14px;">FoodFlow ML Models</p>
                    </div>
                    
                    <!-- Content -->
                    <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                        <h3>Model Status Summary</h3>
                        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                            <thead>
                                <tr style="background-color: #e5e7eb;">
                                    <th style="padding: 10px; text-align: left; border: 1px solid #d1d5db;">Model</th>
                                    <th style="padding: 10px; text-align: center; border: 1px solid #d1d5db;">Status</th>
                                    <th style="padding: 10px; text-align: center; border: 1px solid #d1d5db;">Data Points</th>
                                </tr>
                            </thead>
                            <tbody>
        """
        
        # Add model rows
        for model_name, data in report_data.items():
            status = data.get("status", "unknown")
            count = data.get("count", 0)
            status_emoji = "✅" if status == "ready" else "⚠️" if status == "collecting" else "❌"
            
            html_content += f"""
                                <tr>
                                    <td style="padding: 10px; border: 1px solid #d1d5db;">{model_name}</td>
                                    <td style="padding: 10px; text-align: center; border: 1px solid #d1d5db;">{status_emoji} {status}</td>
                                    <td style="padding: 10px; text-align: center; border: 1px solid #d1d5db;">{count}</td>
                                </tr>
            """
        
        html_content += """
                            </tbody>
                        </table>
                        
                        <div style="margin-top: 20px; padding: 15px; background-color: #dbeafe; border-left: 4px solid #3B82F6; border-radius: 4px;">
                            <p><strong>Next Steps:</strong></p>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                <li>Review the data collection status above</li>
                                <li>Promote rating system to increase quality scorer data</li>
                                <li>Monitor demand forecaster data accumulation</li>
                                <li>Set up automated data validation</li>
                            </ul>
                        </div>
                        
                        <!-- Footer -->
                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                            <p>Report generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
                            <p>FoodFlow Platform</p>
                        </div>
                    </div>
                </div>
            </body>
        </html>
        """
        
        return EmailService.send_email(
            to_email=to_email,
            subject="📊 FoodFlow Data Collection Report",
            html_content=html_content
        )


def _format_details_html(details: dict) -> str:
    """Format details dict as HTML table"""
    if not details:
        return ""
    
    html = '<table style="width: 100%; margin-top: 15px; border-collapse: collapse;">'
    for key, value in details.items():
        html += f"""
        <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; background-color: #f3f4f6;">{key}</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">{value}</td>
        </tr>
        """
    html += '</table>'
    return html


def _format_details_text(details: dict) -> str:
    """Format details dict as plain text"""
    if not details:
        return ""
    
    text = "\nDetails:\n"
    for key, value in details.items():
        text += f"  {key}: {value}\n"
    return text
