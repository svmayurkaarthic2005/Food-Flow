import httpx
from typing import Optional, Dict, Any
from pydantic import BaseModel
from app.core.config import settings

class GoogleOAuthConfig(BaseModel):
    client_id: str
    client_secret: str
    redirect_uri: str
    auth_uri: str
    token_uri: str

# Google OAuth configuration from provided credentials
GOOGLE_OAUTH_CONFIG = GoogleOAuthConfig(
    client_id="672558112297-ruggk2h9bbjij866esgqorc9ih2d7dv5.apps.googleusercontent.com",
    client_secret="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",
    redirect_uri="http://localhost:3000/api/auth/callback/google",
    auth_uri="https://accounts.google.com/o/oauth2/auth",
    token_uri="https://oauth2.googleapis.com/token"
)

class GoogleOAuthService:
    def __init__(self):
        self.config = GOOGLE_OAUTH_CONFIG
        self.scopes = [
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile"
        ]
    
    def get_authorization_url(self, state: Optional[str] = None) -> str:
        """Generate Google OAuth authorization URL"""
        params = {
            "client_id": self.config.client_id,
            "redirect_uri": self.config.redirect_uri,
            "scope": " ".join(self.scopes),
            "response_type": "code",
            "access_type": "offline",
            "prompt": "consent"
        }
        
        if state:
            params["state"] = state
            
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{self.config.auth_uri}?{query_string}"
    
    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        data = {
            "client_id": self.config.client_id,
            "client_secret": self.config.client_secret,
            "code": code,
            "redirect_uri": self.config.redirect_uri,
            "grant_type": "authorization_code"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(self.config.token_uri, data=data)
            response.raise_for_status()
            return response.json()
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get user information from Google"""
        url = "https://www.googleapis.com/oauth2/v2/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return response.json()

google_oauth_service = GoogleOAuthService()
