"""
Test script for email verification endpoint
Run this to verify the email service is working
"""

import requests
import json

# Configuration
BACKEND_URL = "http://localhost:8000"
TEST_EMAIL = "test@example.com"  # Change to your email for testing
TEST_NAME = "Test User"
TEST_TOKEN = "abc123def456"

def test_send_verification_email():
    """Test sending verification email"""
    
    print("🧪 Testing Email Verification Endpoint")
    print("=" * 50)
    
    # Build verification URL
    verification_url = f"http://localhost:3000/auth/verify-email?token={TEST_TOKEN}&email={TEST_EMAIL}"
    
    # Prepare request
    url = f"{BACKEND_URL}/api/send-verification-email"
    payload = {
        "email": TEST_EMAIL,
        "name": TEST_NAME,
        "verification_url": verification_url
    }
    
    print(f"\n📧 Sending test email to: {TEST_EMAIL}")
    print(f"📝 Payload: {json.dumps(payload, indent=2)}")
    
    try:
        # Send request
        response = requests.post(
            url,
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\n📊 Response Status: {response.status_code}")
        print(f"📄 Response Body: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("\n✅ SUCCESS! Verification email sent.")
            print(f"📬 Check your inbox at {TEST_EMAIL}")
            print("\n💡 Tips:")
            print("   - Check spam/junk folder if not in inbox")
            print("   - Email should arrive within 1-2 minutes")
            print("   - Look for subject: 'Verify your FoodFlow account'")
        else:
            print(f"\n❌ FAILED! Status code: {response.status_code}")
            print(f"Error: {response.json()}")
            
    except requests.exceptions.ConnectionError:
        print("\n❌ CONNECTION ERROR!")
        print("Backend server is not running.")
        print("\nTo start backend:")
        print("  cd backend")
        print("  python -m uvicorn main:app --reload")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")


def test_health_check():
    """Test if backend is running"""
    
    print("\n🏥 Testing Backend Health")
    print("=" * 50)
    
    try:
        response = requests.get(f"{BACKEND_URL}/health")
        if response.status_code == 200:
            print("✅ Backend is running")
            return True
        else:
            print(f"⚠️ Backend returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not running")
        return False


if __name__ == "__main__":
    print("\n" + "=" * 50)
    print("  EMAIL VERIFICATION TEST SCRIPT")
    print("=" * 50)
    
    # Check backend health first
    if test_health_check():
        # Run email test
        test_send_verification_email()
    else:
        print("\n⚠️ Please start the backend server first:")
        print("   cd backend")
        print("   python -m uvicorn main:app --reload")
    
    print("\n" + "=" * 50)
    print("  TEST COMPLETE")
    print("=" * 50 + "\n")
