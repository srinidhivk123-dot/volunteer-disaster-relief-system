from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.dependencies import get_current_user
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentResponse
)
from app.services.assignment_service import (
    create_assignment,
    get_assignment_by_id,
    get_all_assignments
)


router = APIRouter(
    prefix="/assignments",
    tags=["Assignments"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.post(
    "/",
    response_model=AssignmentResponse
)
def create_new_assignment(
    assignment_data: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    try:
        return create_assignment(
            db,
            assignment_data
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


@router.get(
    "/",
    response_model=list[AssignmentResponse]
)
def get_assignments(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return get_all_assignments(db)


@router.get(
    "/{assignment_id}",
    response_model=AssignmentResponse
)
def get_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    assignment = get_assignment_by_id(
        db,
        assignment_id
    )

    if assignment is None:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found"
        )

    return assignment