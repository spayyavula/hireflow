from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from api.core.config import hash_password, verify_password, create_access_token
from api.core.database import get_user_by_email, create_user
from api.models.schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserPublic,
    UserRole,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(req: RegisterRequest):
    """Register a new user (seeker, recruiter, or company)."""
    if get_user_by_email(req.email):
        raise HTTPException(status_code=409, detail="Email already registered")

    if req.role == UserRole.COMPANY and not req.company_name:
        raise HTTPException(status_code=400, detail="company_name is required for company accounts")

    user_id = f"user_{uuid4().hex[:12]}"
    user = create_user({
        "id": user_id,
        "email": req.email,
        "hashed_password": hash_password(req.password),
        "role": req.role.value,
        "name": req.name,
        "company_name": req.company_name,
    })

    token = create_access_token({"sub": user_id, "role": req.role.value})
    return TokenResponse(
        access_token=token,
        user=UserPublic(
            id=user_id,
            email=req.email,
            role=req.role,
            name=req.name,
            company_name=req.company_name,
        ),
    )


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    """Login with email and password."""
    user = get_user_by_email(req.email)
    if not user or not verify_password(req.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user["id"], "role": user["role"]})
    return TokenResponse(
        access_token=token,
        user=UserPublic(
            id=user["id"],
            email=user["email"],
            role=user["role"],
            name=user.get("name"),
            company_name=user.get("company_name"),
        ),
    )
