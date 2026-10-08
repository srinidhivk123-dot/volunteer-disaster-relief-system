import logging

from sqlalchemy.orm import Session

from app.models.assignment import Assignment
from app.models.relief_request import ReliefRequest
from app.models.user import User
from app.models.volunteer import Volunteer
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


def create_guest_relief_request(db,request_data):
    new_request=ReliefRequest(
        victim_id=None,
        disaster_id=request_data.disaster_id,
        request_type=request_data.request_type,
        description=request_data.description,
        location=request_data.location,
        priority=request_data.priority,
        request_source="guest",
        phone=request_data.phone
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    logger.info(
        "Guest relief request created: request_id=%s disaster_id=%s",
        new_request.id,
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
        ReliefRequest.id==request_id
    ).first()

    if request is None:
        return None

    new_status=status_data.status
    current_status=request.status
    role=current_user["role"]

    allowed_statuses={
        "pending",
        "assigned",
        "in_progress",
        "completed",
        "cancelled"
    }

    if new_status not in allowed_statuses:
        raise ValueError("Invalid relief request status")

    if role=="victim":
        if request.victim_id!=current_user["user_id"]:
            raise PermissionError(
                "You can only update your own requests"
            )

        if new_status!="cancelled":
            raise PermissionError(
                "Victims can only cancel their requests"
            )

    elif role=="admin":
        pass

    elif role=="volunteer":
        if new_status not in {
            "in_progress",
            "completed"
        }:
            raise PermissionError(
                "Volunteers can only update request progress"
            )

        volunteer=db.query(Volunteer).filter(
            Volunteer.user_id==current_user["user_id"]
        ).first()

        if volunteer is None:
            raise ValueError("Volunteer profile not found")

        assignment=db.query(Assignment).filter(
            Assignment.relief_request_id==request.id,
            Assignment.volunteer_id==volunteer.id
        ).first()

        if assignment is None:
            raise PermissionError(
                "You can only update requests assigned to you"
            )

    else:
        raise PermissionError(
            "You are not authorized to update relief requests"
        )

    allowed_transitions={
        "pending":{
            "assigned",
            "cancelled"
        },
        "assigned":{
            "in_progress",
            "cancelled"
        },
        "in_progress":{
            "completed",
            "cancelled"
        },
        "completed":set(),
        "cancelled":set()
    }

    if new_status not in allowed_transitions.get(
        current_status,
        set()
    ):
        raise ValueError("Invalid status transition")

    request.status=new_status

    db.commit()
    db.refresh(request)

    logger.info(
        "Relief request status updated: request_id=%s old_status=%s new_status=%s user_id=%s",
        request.id,
        current_status,
        new_status,
        current_user["user_id"]
    )

    return request