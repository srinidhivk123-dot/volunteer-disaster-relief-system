from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, get_db

from app.core.dependencies import require_role
from app.schemas.volunteer import (
    VolunteerCreate,
    VolunteerResponse
)
from app.services.volunteer_service import (
    create_volunteer_profile,
    get_my_volunteer_profile,
    get_all_volunteers,
    update_my_volunteer_profile
)
from app.services.volunteer_matching_service import (
    find_nearby_volunteers
)

router = APIRouter(
    prefix="/volunteers",
    tags=["Volunteers"]
)





@router.post(
    "/",
    response_model=VolunteerResponse
)
def create_profile(
    volunteer_data: VolunteerCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("volunteer"))
):
    try:
        return create_volunteer_profile(
            db,
            volunteer_data,
            current_user
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


@router.get(
    "/",
    response_model=list[VolunteerResponse]
)
def get_volunteers(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin"))
):
    return get_all_volunteers(db)


@router.get(
    "/me",
    response_model=VolunteerResponse
)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("volunteer"))
):
    volunteer = get_my_volunteer_profile(
        db,
        current_user
    )

    if volunteer is None:
        raise HTTPException(
            status_code=404,
            detail="Volunteer profile not found"
        )

    return volunteer
@router.get(
    "/nearby/{relief_request_id}"
)
def get_nearby_volunteers(
    relief_request_id:int,
    db:Session=Depends(get_db),
    current_user=Depends(require_role("admin"))
):
    result=find_nearby_volunteers(
        db,
        relief_request_id
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Relief request not found"
        )

    return result


@router.put(
    "/me",
    response_model=VolunteerResponse
)
def update_my_profile(
    volunteer_data: VolunteerCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("volunteer"))
):
    volunteer = update_my_volunteer_profile(
        db,
        volunteer_data,
        current_user
    )

    if volunteer is None:
        raise HTTPException(
            status_code=404,
            detail="Volunteer profile not found"
        )

    return volunteer