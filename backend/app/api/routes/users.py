from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional

from app.core.security import get_current_user, get_password_hash
from app.db.database import prisma

router = APIRouter()

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

@router.get("/{user_id}")
async def get_user(user_id: str):
    """Get user by ID"""
    user = await prisma.user.find_unique(
        where={"id": user_id},
        include={
            "donor": True,
            "ngo": True
        }
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "phone": user.phone,
        "address": user.address,
        "emailVerified": user.emailVerified,
        "donor": user.donor,
        "ngo": user.ngo
    }

@router.patch("/{user_id}")
async def update_user(
    user_id: str,
    data: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile"""
    # Verify user is updating their own profile or is admin
    if current_user["id"] != user_id and current_user["role"] != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user"
        )
    
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    
    user = await prisma.user.update(
        where={"id": user_id},
        data=update_data
    )
    
    return user
