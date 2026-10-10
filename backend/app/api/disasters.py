from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.dependencies import get_current_user, require_role
from app.schemas.disaster import (
    DisasterCreate,
    DisasterUpdate,
    DisasterResponse
)
from app.services.disaster_service import (
    create_disaster,
    get_all_disasters,
    get_active_disasters,
    get_disaster_by_id,
    update_disaster,
    delete_disaster
)


router = APIRouter(
    prefix="/disasters",
    tags=["Disasters"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "/",
    response_model=DisasterResponse
)
def create_new_disaster(
    disaster_data: DisasterCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin"))
):
    try:
        return create_disaster(
            db,
            disaster_data
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


@router.get(
    "/",
    response_model=list[DisasterResponse]
)
def get_disasters(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return get_all_disasters(db)


@router.get(
    "/active",
    response_model=list[DisasterResponse]
)
def get_active(
    db: Session = Depends(get_db)
):
    return get_active_disasters(db)


@router.get(
    "/{disaster_id}",
    response_model=DisasterResponse
)
def get_disaster(
    disaster_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    disaster = get_disaster_by_id(
        db,
        disaster_id
    )

    if disaster is None:
        raise HTTPException(
            status_code=404,
            detail="Disaster not found"
        )

    return disaster


@router.put(
    "/{disaster_id}",
    response_model=DisasterResponse
)
def update_existing_disaster(
    disaster_id: int,
    disaster_data: DisasterUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin"))
):
    try:
        disaster = update_disaster(
            db,
            disaster_id,
            disaster_data
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    if disaster is None:
        raise HTTPException(
            status_code=404,
            detail="Disaster not found"
        )

    return disaster


@router.delete(
    "/{disaster_id}"
)
def delete_existing_disaster(
    disaster_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin"))
):
    disaster = delete_disaster(
        db,
        disaster_id
    )

    if disaster is None:
        raise HTTPException(
            status_code=404,
            detail="Disaster not found"
        )

    return {
        "message": "Disaster deleted successfully"
    }