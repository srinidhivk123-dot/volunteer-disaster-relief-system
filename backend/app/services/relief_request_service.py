import logging

from sqlalchemy.orm import Session
from app.models.relief_request import ReliefRequest
from app.models.user import User
from app.schemas.relief_request import (
    ReliefRequestCreate,
    AssistedReliefRequestCreate,
    ReliefRequestStatusUpdate
)

logger=logging.getLogger(__name__)


def create_relief_request(db,request_data,current_user):
    new_request=ReliefRequest(
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

    logger.info(
        "Relief request created: request_id=%s victim_id=%s disaster_id=%s",
        new_request.id,
        new_request.victim_id,
        new_request.disaster_id
    )

    return new_request


def create_assisted_relief_request(db,request_data):
    victim=db.query(User).filter(
        User.id==request_data.victim_id
    ).first()

    if victim is None:
        raise ValueError("Victim not found")

    if victim.role!="victim":
        raise ValueError("Selected user is not a victim")

    new_request=ReliefRequest(
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

    logger.info(
        "Assisted relief request created: request_id=%s victim_id=%s disaster_id=%s",
        new_request.id,
        new_request.victim_id,
        new_request.disaster_id
    )

    return new_request


def get_my_relief_requests(db,current_user):
    return db.query(ReliefRequest).filter(
        ReliefRequest.victim_id==current_user["user_id"]
    ).order_by(ReliefRequest.id.desc()).all()


def get_all_relief_requests(db):
    return db.query(ReliefRequest).order_by(
        ReliefRequest.id.desc()
    ).all()


def get_relief_request_by_id(db,request_id,current_user):
    return db.query(ReliefRequest).filter(
        ReliefRequest.id==request_id,
        ReliefRequest.victim_id==current_user["user_id"]
    ).first()


def update_relief_request_status(
    db,
    request_id,
    status_data,
    current_user
):
    request=db.query(ReliefRequest).filter(
        ReliefRequest.id==request_id,
        ReliefRequest.victim_id==current_user["user_id"]
    ).first()

    if request is None:
        return None

    allowed_statuses={
        "pending",
        "assigned",
        "in_progress",
        "completed"
    }

    if status_data.status not in allowed_statuses:
        raise ValueError("Invalid relief request status")

    request.status=status_data.status

    db.commit()
    db.refresh(request)

    return request