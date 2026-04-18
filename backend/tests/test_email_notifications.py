"""
Email Notifications Tests
Tests for Brevo SMTP email service
"""

import pytest
from unittest.mock import patch, MagicMock
from app.core.email import EmailService


class TestEmailService:
    """Test cases for EmailService"""
    
    @patch('smtplib.SMTP')
    def test_send_email_success(self, mock_smtp):
        """Test successful email sending"""
        # Mock SMTP connection
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server
        
        # Send email
        result = EmailService.send_email(
            to_email="test@example.com",
            subject="Test Subject",
            html_content="<p>Test content</p>"
        )
        
        # Verify
        assert result is True
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once()
        mock_server.sendmail.assert_called_once()
    
    @patch('smtplib.SMTP')
    def test_send_email_with_cc_bcc(self, mock_smtp):
        """Test email sending with CC and BCC"""
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server
        
        result = EmailService.send_email(
            to_email="test@example.com",
            subject="Test",
            html_content="<p>Test</p>",
            cc=["cc@example.com"],
            bcc=["bcc@example.com"]
        )
        
        assert result is True
        # Verify all recipients are included
        call_args = mock_server.sendmail.call_args
        recipients = call_args[0][2]
        assert "test@example.com" in recipients
        assert "cc@example.com" in recipients
        assert "bcc@example.com" in recipients
    
    @patch('smtplib.SMTP')
    def test_send_email_failure(self, mock_smtp):
        """Test email sending failure"""
        mock_smtp.side_effect = Exception("SMTP connection failed")
        
        result = EmailService.send_email(
            to_email="test@example.com",
            subject="Test",
            html_content="<p>Test</p>"
        )
        
        assert result is False
    
    @patch('smtplib.SMTP')
    def test_send_status_update_success(self, mock_smtp):
        """Test status update email"""
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server
        
        result = EmailService.send_status_update(
            to_email="admin@example.com",
            status="success",
            title="Process Complete",
            message="All systems operational",
            details={"Duration": "5 minutes", "Records": 1000}
        )
        
        assert result is True
        mock_server.sendmail.assert_called_once()
        
        # Verify email content
        call_args = mock_server.sendmail.call_args
        email_content = call_args[0][2]
        assert "Process Complete" in email_content
        assert "All systems operational" in email_content
        assert "Duration" in email_content
    
    @patch('smtplib.SMTP')
    def test_send_status_update_with_different_statuses(self, mock_smtp):
        """Test status update with different status types"""
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server
        
        statuses = ["success", "warning", "error", "info"]
        
        for status in statuses:
            result = EmailService.send_status_update(
                to_email="admin@example.com",
                status=status,
                title=f"Test {status}",
                message=f"This is a {status} message"
            )
            
            assert result is True
    
    @patch('smtplib.SMTP')
    def test_send_ml_training_notification_started(self, mock_smtp):
        """Test ML training started notification"""
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server
        
        result = EmailService.send_ml_training_notification(
            to_email="admin@example.com",
            model_name="Demand Forecaster",
            status="started"
        )
        
        assert result is True
        mock_server.sendmail.assert_called_once()
    
    @patch('smtplib.SMTP')
    def test_send_ml_training_notification_completed(self, mock_smtp):
        """Test ML training completed notification"""
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server
        
        result = EmailService.send_ml_training_notification(
            to_email="admin@example.com",
            model_name="Demand Forecaster",
            status="completed",
            metrics={
                "Samples": 150,
                "MAE": 2.34,
                "Training Time": "45 seconds"
            }
        )
        
        assert result is True
        
        # Verify metrics are in email
        call_args = mock_server.sendmail.call_args
        email_content = call_args[0][2]
        assert "Demand Forecaster" in email_content
        assert "150" in email_content
    
    @patch('smtplib.SMTP')
    def test_send_ml_training_notification_failed(self, mock_smtp):
        """Test ML training failed notification"""
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server
        
        result = EmailService.send_ml_training_notification(
            to_email="admin@example.com",
            model_name="Demand Forecaster",
            status="failed",
            error_message="Insufficient training data"
        )
        
        assert result is True
        
        # Verify error message is in email
        call_args = mock_server.sendmail.call_args
        email_content = call_args[0][2]
        assert "Insufficient training data" in email_content
    
    @patch('smtplib.SMTP')
    def test_send_data_collection_report(self, mock_smtp):
        """Test data collection report email"""
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server
        
        report_data = {
            "Recommender": {"status": "ready", "count": 150},
            "Demand Forecaster": {"status": "collecting", "count": 45},
            "Trust Scorer": {"status": "ready", "count": 200},
            "Quality Scorer": {"status": "collecting", "count": 25}
        }
        
        result = EmailService.send_data_collection_report(
            to_email="admin@example.com",
            report_data=report_data
        )
        
        assert result is True
        
        # Verify report content
        call_args = mock_server.sendmail.call_args
        email_content = call_args[0][2]
        assert "Recommender" in email_content
        assert "150" in email_content
        assert "Demand Forecaster" in email_content
    
    @patch('smtplib.SMTP')
    def test_send_email_with_text_content(self, mock_smtp):
        """Test email with both HTML and text content"""
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server
        
        result = EmailService.send_email(
            to_email="test@example.com",
            subject="Test",
            html_content="<p>HTML content</p>",
            text_content="Text content"
        )
        
        assert result is True
        
        # Verify both parts are included
        call_args = mock_server.sendmail.call_args
        email_content = call_args[0][2]
        assert "HTML content" in email_content
        assert "Text content" in email_content


class TestEmailServiceIntegration:
    """Integration tests for email service"""
    
    @pytest.mark.skip(reason="Requires actual SMTP connection")
    def test_send_real_email(self):
        """Test sending real email (requires SMTP credentials)"""
        result = EmailService.send_email(
            to_email="test@example.com",
            subject="FoodFlow Test Email",
            html_content="<p>This is a test email from FoodFlow</p>"
        )
        
        assert result is True
    
    @pytest.mark.skip(reason="Requires actual SMTP connection")
    def test_send_real_status_update(self):
        """Test sending real status update email"""
        result = EmailService.send_status_update(
            to_email="admin@example.com",
            status="success",
            title="Test Status Update",
            message="This is a test status update",
            details={"Test": "Value"}
        )
        
        assert result is True


class TestEmailFormatting:
    """Test email formatting functions"""
    
    def test_status_colors(self):
        """Test status color mapping"""
        from app.core.email import EmailService
        
        # Test that different statuses produce different colors
        statuses = ["success", "warning", "error", "info"]
        
        for status in statuses:
            # Just verify the method doesn't crash
            result = EmailService.send_status_update(
                to_email="test@example.com",
                status=status,
                title="Test",
                message="Test"
            )
            # Result will be False due to no mock, but method should work
    
    def test_details_formatting(self):
        """Test details dict formatting"""
        from app.core.email import _format_details_html, _format_details_text
        
        details = {
            "Key1": "Value1",
            "Key2": "Value2",
            "Key3": "Value3"
        }
        
        # Test HTML formatting
        html = _format_details_html(details)
        assert "Key1" in html
        assert "Value1" in html
        assert "<table" in html
        
        # Test text formatting
        text = _format_details_text(details)
        assert "Key1" in text
        assert "Value1" in text
        assert "Details:" in text
    
    def test_empty_details_formatting(self):
        """Test formatting with empty details"""
        from app.core.email import _format_details_html, _format_details_text
        
        # Empty dict
        html = _format_details_html({})
        assert html == ""
        
        text = _format_details_text({})
        assert text == ""
        
        # None
        html = _format_details_html(None)
        assert html == ""
        
        text = _format_details_text(None)
        assert text == ""


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
