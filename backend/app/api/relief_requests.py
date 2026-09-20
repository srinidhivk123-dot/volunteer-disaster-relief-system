from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.schemas.relief_request import (
    ReliefRequestCreate,
    ReliefRequestResponse
)
from app.services.relief_request_service import create_relief_request


router = APIRouter(
    prefix="/relief-requests",
    tags=["Relief Requests"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.post(
    "/",
    response_model=ReliefRequestResponse
)
def create_request(
    request_data: ReliefRequestCreate,
    db: Session = Depends(get_db)
):
    return create_relief_request(db, request_data)