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
            == assignment_data.relief_request_id
        )
        .first()
    )

    if existing_assignment is not None:
        raise ValueError("Relief request already assigned")

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
    assignment_id: int,
    current_user
):
    query = (
        db.query(Assignment)
        .filter(
            Assignment.id == assignment_id
        )
    )

    if current_user["role"] == "volunteer":
        volunteer = (
            db.query(Volunteer)
            .filter(
                Volunteer.user_id == current_user["user_id"]
            )
            .first()
        )

        if volunteer is None:
            raise ValueError("Volunteer profile not found")

        query = query.filter(
            Assignment.volunteer_id == volunteer.id
        )

    return query.first()


def get_all_assignments(
    db: Session,
    current_user
):
    query = db.query(Assignment)

    if current_user["role"] == "volunteer":
        volunteer = (
            db.query(Volunteer)
            .filter(
                Volunteer.user_id == current_user["user_id"]
            )
            .first()
        )

        if volunteer is None:
            raise ValueError("Volunteer profile not found")

        query = query.filter(
            Assignment.volunteer_id == volunteer.id
        )

    return (
        query
        .order_by(Assignment.id.desc())
        .all()
    )


def update_assignment_status(
    db: Session,
    assignment_id: int,
    status_data,
    current_user
):
    assignment = (
        db.query(Assignment)
        .filter(
            Assignment.id == assignment_id
        )
        .first()
    )

    if assignment is None:
        return None

    if current_user["role"] == "volunteer":
        volunteer = (
            db.query(Volunteer)
            .filter(
                Volunteer.user_id == current_user["user_id"]
            )
            .first()
        )

        if volunteer is None:
            raise ValueError("Volunteer profile not found")

        if assignment.volunteer_id != volunteer.id:
            raise PermissionError(
                "You can only update your own assignments"
            )

    allowed_statuses = {
        "assigned",
        "in_progress",
        "completed"
    }

    if status_data.status not in allowed_statuses:
        raise ValueError("Invalid assignment status")

    assignment.status = status_data.status

    db.commit()
    db.refresh(assignment)

    return assignment