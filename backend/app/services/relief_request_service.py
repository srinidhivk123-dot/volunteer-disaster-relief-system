from sqlalchemy.orm import Session

from app.models.relief_request import ReliefRequest
from app.models.user import User
from app.schemas.relief_request import (
    ReliefRequestCreate,
    AssistedReliefRequestCreate,
    ReliefRequestStatusUpdate
)


def create_relief_request(
    db: Session,
    request_data: ReliefRequestCreate,
    current_user
):
    new_request = ReliefRequest(
        victim_id=current_user["user_id"],
        disaster_id=request_data.disaster_id,
        request_type=request_data.request_type,
        description=request_data.description,
        location=request_data.location,
        priority=request_data.priority,
        request_source=request_data.request_source
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return new_request


def create_assisted_relief_request(
    db: Session,
    request_data: AssistedReliefRequestCreate
):
    victim = (
        db.query(User)
        .filter(
            User.id == request_data.victim_id
        )
        .first()
    )

    if victim is None:
        raise ValueError("Victim not found")

    if victim.role != "victim":
        raise ValueError(
            "Selected user is not a victim"
        )

    new_request = ReliefRequest(
        victim_id=request_data.victim_id,
        disaster_id=request_data.disaster_id,
        request_type=request_data.request_type,
        description=request_data.description,
        location=request_data.location,
        priority=request_data.priority,
        request_source="assisted"
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return new_request


def get_my_relief_requests(
    db: Session,
    current_user
):
    requests = (
        db.query(ReliefRequest)
        .filter(
            ReliefRequest.victim_id == current_user["user_id"]
        )
        .order_by(ReliefRequest.id.desc())
        .all()
    )

    return requests


def get_relief_request_by_id(
    db: Session,
    request_id: int,
    current_user
):
    request = (
        db.query(ReliefRequest)
        .filter(
            ReliefRequest.id == request_id,
            ReliefRequest.victim_id == current_user["user_id"]
        )
        .first()
    )

    return request


def update_relief_request_status(
    db: Session,
    request_id: int,
    status_data: ReliefRequestStatusUpdate,
    current_user
):
    request = (
        db.query(ReliefRequest)
        .filter(
            ReliefRequest.id == request_id,
            ReliefRequest.victim_id == current_user["user_id"]
        )
        .first()
    )

    if request is None:
        return None

    allowed_statuses = {
        "pending",
        "assigned",
        "in_progress",
        "completed"
    }

    if status_data.status not in allowed_statuses:
        raise ValueError("Invalid relief request status")

    request.status = status_data.status

    db.commit()
    db.refresh(request)

    return request