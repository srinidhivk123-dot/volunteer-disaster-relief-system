from sqlalchemy.orm import Session

from app.models.assignment import Assignment
from app.models.relief_request import ReliefRequest
from app.models.volunteer import Volunteer
from app.schemas.assignment import AssignmentCreate


def create_assignment(
    db: Session,
    assignment_data: AssignmentCreate
):
    relief_request = (
        db.query(ReliefRequest)
        .filter(
            ReliefRequest.id == assignment_data.relief_request_id
        )
        .first()
    )

    if relief_request is None:
        raise ValueError("Relief request not found")

    volunteer = (
        db.query(Volunteer)
        .filter(
            Volunteer.id == assignment_data.volunteer_id
        )
        .first()
    )

    if volunteer is None:
        raise ValueError("Volunteer not found")

    existing_assignment = (
        db.query(Assignment)
        .filter(
            Assignment.relief_request_id
            == assignment_data.relief_request_id,
            Assignment.volunteer_id
            == assignment_data.volunteer_id
        )
        .first()
    )

    if existing_assignment:
        raise ValueError(
            "Volunteer is already assigned to this request"
        )

    new_assignment = Assignment(
        relief_request_id=assignment_data.relief_request_id,
        volunteer_id=assignment_data.volunteer_id,
        status="assigned"
    )

    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)

    return new_assignment


def get_assignment_by_id(
    db: Session,
    assignment_id: int
):
    return (
        db.query(Assignment)
        .filter(
            Assignment.id == assignment_id
        )
        .first()
    )


def get_all_assignments(
    db: Session
):
    return (
        db.query(Assignment)
        .order_by(Assignment.id.desc())
        .all()
    )