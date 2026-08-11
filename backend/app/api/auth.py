from fastapi import APIRouter
from pydantic import BaseModel

from app.core.database import SessionLocal
from app.core.security import hash_password
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


@router.post("/register")
def register(user: RegisterRequest):

    db = SessionLocal()

    try:
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