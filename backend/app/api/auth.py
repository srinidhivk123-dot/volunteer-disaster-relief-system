from fastapi import APIRouter,HTTPException,Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)
from app.core.dependencies import get_current_user
from app.models.user import User


router=APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


class RegisterRequest(BaseModel):
    name:str
    email:str
    password:str
    role:str


class LoginRequest(BaseModel):
    email:str
    password:str


def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/register")
def register(
    user:RegisterRequest,
    db:Session=Depends(get_db)
):
    existing_user=db.query(User).filter(
        User.email==user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user=User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password),
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message":"User registered successfully",
        "user_id":new_user.id
    }


@router.post("/login")
def login(
    user:LoginRequest,
    db:Session=Depends(get_db)
):
    existing_user=db.query(User).filter(
        User.email==user.email
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

    token=create_access_token({
        "user_id":existing_user.id,
        "role":existing_user.role
    })

    return {
        "message":"Login successful",
        "access_token":token,
        "token_type":"bearer"
    }


@router.get("/me")
def get_me(
    current_user=Depends(get_current_user)
):
    return {
        "message":"You are authenticated",
        "user":current_user
    }