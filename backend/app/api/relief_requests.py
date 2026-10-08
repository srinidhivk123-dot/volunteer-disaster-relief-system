from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.dependencies import (
    get_current_user,
    require_role
)
from app.schemas.relief_request import (
    ReliefRequestCreate,
    GuestReliefRequestCreate,
    AssistedReliefRequestCreate,
    ReliefRequestResponse,
    ReliefRequestStatusUpdate
)
from app.services.relief_request_service import (
    create_relief_request,
    create_guest_relief_request,
    create_assisted_relief_request,
    get_my_relief_requests,
    get_all_relief_requests,
    get_relief_request_by_id,
    update_relief_request_status
)


router=APIRouter(
    prefix="/relief-requests",
    tags=["Relief Requests"]
)


def get_db():
    db=SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.post(
    "/",
    response_model=ReliefRequestResponse
)
def create_request(
    request_data:ReliefRequestCreate,
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    return create_relief_request(
        db,
        request_data,
        current_user
    )


@router.post(
    "/guest",
    response_model=ReliefRequestResponse
)
def create_guest_request(
    request_data:GuestReliefRequestCreate,
    db:Session=Depends(get_db)
):
    return create_guest_relief_request(
        db,
        request_data
    )


@router.post(
    "/assisted",
    response_model=ReliefRequestResponse
)
def create_assisted_request(
    request_data:AssistedReliefRequestCreate,
    db:Session=Depends(get_db),
    current_user=Depends(require_role("volunteer"))
):
    try:
        return create_assisted_relief_request(
            db,
            request_data
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


@router.get(
    "/my",
    response_model=list[ReliefRequestResponse]
)
def get_my_requests(
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    return get_my_relief_requests(
        db,
        current_user
    )


@router.get(
    "/",
    response_model=list[ReliefRequestResponse]
)
def get_all_requests(
    db:Session=Depends(get_db),
    current_user=Depends(require_role("admin"))
):
    return get_all_relief_requests(db)


@router.get(
    "/{request_id}",
    response_model=ReliefRequestResponse
)
def get_request(
    request_id:int,
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    request=get_relief_request_by_id(
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
    request_id:int,
    status_data:ReliefRequestStatusUpdate,
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    try:
        request=update_relief_request_status(
            db,
            request_id,
            status_data,
            current_user
        )
    except PermissionError as error:
        raise HTTPException(
            status_code=403,
            detail=str(error)
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