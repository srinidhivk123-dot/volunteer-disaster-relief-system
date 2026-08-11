from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.database import SessionLocal
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register")
def register(user: RegisterRequest):

    db = SessionLocal()

    try:
        existing_user = db.query(User).filter(
            User.email == user.email
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

        new_user = User(
            name=user.name,
            email=user.email,
            password_hash=hash_password(user.password),
            role=user.role
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {
            "message": "User registered successfully",
            "user_id": new_user.id
        }

    finally:
        db.close()


@router.post("/login")
def login(user: LoginRequest):

    db = SessionLocal()

    try:
        existing_user = db.query(User).filter(
            User.email == user.email
        ).first()

        if not existing_user:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        if not verify_password(
            user.password,
            existing_user.password_hash
        ):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        token = create_access_token({
            "user_id": existing_user.id,
            "role": existing_user.role
        })

        return {
            "message": "Login successful",
            "access_token": token,
            "token_type": "bearer"
        }

    finally:
        db.close()