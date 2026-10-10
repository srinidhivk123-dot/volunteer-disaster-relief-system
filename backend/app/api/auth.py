from fastapi import APIRouter,HTTPException,Depends
from pydantic import BaseModel,field_validator
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)
from app.core.dependencies import get_current_user
from app.models.user import User


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)



class RegisterRequest(BaseModel):
    name:str
    email:str
    password:str
    role:str="victim"

    @field_validator("password")
    @classmethod
    def validate_password(cls,value):
        if len(value)<8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(char.isupper() for char in value):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(char.islower() for char in value):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(char.isdigit() for char in value):
            raise ValueError("Password must contain at least one digit")
        return value


class VolunteerRegisterRequest(BaseModel):
    name:str
    email:str
    password:str
    skills:str|None="General Disaster Relief"
    phone:str|None=None

    @field_validator("password")
    @classmethod
    def validate_password(cls,value):
        if len(value)<8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(char.isupper() for char in value):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(char.islower() for char in value):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(char.isdigit() for char in value):
            raise ValueError("Password must contain at least one digit")
        return value


class LoginRequest(BaseModel):
    email:str
    password:str


def perform_login(user_creds: LoginRequest, db: Session, required_role: str | None = None):
    clean_email = user_creds.email.strip().lower()
    existing_user = db.query(User).filter(
        func.lower(User.email) == clean_email
    ).first()

    if not existing_user or not verify_password(user_creds.password, existing_user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Enforce role-specific portal login if requested
    if required_role and existing_user.role.lower() != required_role.lower():
        raise HTTPException(
            status_code=403,
            detail=f"Access denied: This account is registered as a {existing_user.role.capitalize()}, not an {required_role.capitalize()}. Please sign in through the {existing_user.role.capitalize()} login portal."
        )


    token = create_access_token({
        "user_id": existing_user.id,
        "role": existing_user.role
    })

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "role": existing_user.role,
        "user_id": existing_user.id,
        "name": existing_user.name
    }


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

    requested_role = user.role.lower() if user.role else "victim"
    if requested_role == "admin":
        raise HTTPException(
            status_code=400,
            detail="Public administrator registration is not permitted. Please contact administration."
        )

    if requested_role not in ["victim", "volunteer"]:
        requested_role = "victim"

    new_user=User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password),
        role=requested_role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if requested_role == "volunteer":
        from app.models.volunteer import Volunteer
        existing_vol = db.query(Volunteer).filter(Volunteer.user_id == new_user.id).first()
        if not existing_vol:
            new_vol = Volunteer(
                user_id=new_user.id,
                skills="General Disaster Relief",
                availability="Available",
                latitude=None,
                longitude=None
            )
            db.add(new_vol)
            db.commit()

    return {
        "message":"User registered successfully",
        "user_id":new_user.id,
        "role":requested_role
    }


@router.post("/register/volunteer")
def register_volunteer(
    user:VolunteerRegisterRequest,
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
        role="volunteer"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    from app.models.volunteer import Volunteer
    new_vol = Volunteer(
        user_id=new_user.id,
        skills=user.skills.strip() if user.skills else "General Disaster Relief",
        availability="Available",
        latitude=None,
        longitude=None
    )
    db.add(new_vol)
    db.commit()

    return {
        "message":"Volunteer registered successfully",
        "user_id":new_user.id,
        "role":"volunteer"
    }


@router.post("/login")
def login(
    user:LoginRequest,
    db:Session=Depends(get_db)
):
    return perform_login(user, db, required_role=None)


@router.post("/login/victim")
def login_victim(
    user:LoginRequest,
    db:Session=Depends(get_db)
):
    return perform_login(user, db, required_role="victim")


@router.post("/login/volunteer")
def login_volunteer(
    user:LoginRequest,
    db:Session=Depends(get_db)
):
    return perform_login(user, db, required_role="volunteer")


@router.post("/login/admin")
def login_admin(
    user:LoginRequest,
    db:Session=Depends(get_db)
):
    return perform_login(user, db, required_role="admin")


@router.get("/me")
def get_me(
    current_user=Depends(get_current_user)
):
    return {
        "message":"You are authenticated",
        "user":current_user
    }