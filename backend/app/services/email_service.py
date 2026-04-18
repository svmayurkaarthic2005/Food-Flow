"""
Async Email Service using Brevo SMTP
Non-blocking email sending with TLS support
"""

import aiosmtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_email(
    to: str,
    subject: str,
    html: str,
    text: Optional[str] = None
) -> None:
    """
    Send email asynchronously via Brevo SMTP.
    
    Args:
        to: Recipient email address
        subject: Email subject
        html: HTML email body
        text: Plain text fallback (optional)
        
    Raises:
        Exception: Only on critical SMTP errors
    """
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("Email service not configured, skipping email send")
        return
    
    try:
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to
        
        # Add text and HTML parts
        if text:
            msg.attach(MIMEText(text, "plain"))
        msg.attach(MIMEText(html, "html"))
        
        # Send via SMTP
        async with aiosmtplib.SMTP(
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            use_tls=True
        ) as smtp:
            await smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            await smtp.send_message(msg)
        
        logger.info(f"✅ Email sent to {to}: {subject}")
        
    except Exception as e:
        logger.error(f"❌ Failed to send email to {to}: {str(e)}")
        # Don't raise - let queue retry
        raise
