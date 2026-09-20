from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.dependencies import get_current_user
from app.schemas.relief_request import (
    ReliefRequestCreate,
    ReliefRequestResponse
)
from app.services.relief_request_service import (
    create_relief_request,
    get_my_relief_requests
)


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
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return create_relief_request(
        db,
        request_data,
        current_user
    )


@router.get(
    "/my",
    response_model=list[ReliefRequestResponse]
)
def get_my_requests(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return get_my_relief_requests(
        db,
        current_user
    )