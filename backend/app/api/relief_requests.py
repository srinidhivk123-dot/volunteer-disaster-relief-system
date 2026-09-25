from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.dependencies import get_current_user
from app.schemas.relief_request import (
    ReliefRequestCreate,
    ReliefRequestResponse,
    ReliefRequestStatusUpdate
)
from app.services.relief_request_service import (
    create_relief_request,
    get_my_relief_requests,
    get_relief_request_by_id,
    update_relief_request_status
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


@router.get(
    "/{request_id}",
    response_model=ReliefRequestResponse
)
def get_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    request = get_relief_request_by_id(
        db,
        request_id,
        current_user
    )

    if request is None:
        raise HTTPException(
            status_code=404,
            detail="Relief request not found"
        )

    return request


@router.patch(
    "/{request_id}/status",
    response_model=ReliefRequestResponse
)
def update_request_status(
    request_id: int,
    status_data: ReliefRequestStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    try:
        request = update_relief_request_status(
            db,
            request_id,
            status_data,
            current_user
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    if request is None:
        raise HTTPException(
            status_code=404,
            detail="Relief request not found"
        )

    return request