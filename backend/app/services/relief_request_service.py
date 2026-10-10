import logging

from sqlalchemy.orm import Session

from app.models.assignment import Assignment
from app.models.disaster import Disaster
from app.models.relief_request import ReliefRequest
from app.models.user import User
from app.models.volunteer import Volunteer
from sqlalchemy.exc import IntegrityError
from app.schemas.relief_request import (
    ReliefRequestCreate,
    AssistedReliefRequestCreate,
    ReliefRequestStatusUpdate
)

logger=logging.getLogger(__name__)


def _validate_active_disaster(db: Session, disaster_id: int) -> Disaster:
    disaster = db.query(Disaster).filter(
        Disaster.id == disaster_id
    ).first()
    if disaster is None:
        raise ValueError("Selected disaster does not exist")
    if str(disaster.status).lower() != "active":
        raise ValueError("Selected disaster is not active")
    return disaster


def create_relief_request(db, request_data, current_user):
    _validate_active_disaster(db, request_data.disaster_id)

    new_request = ReliefRequest(
        victim_id=current_user["user_id"],
        disaster_id=request_data.disaster_id,
        request_type=request_data.request_type,
        description=request_data.description,
        location=request_data.location,
        priority=request_data.priority,
        request_source=request_data.request_source,
        latitude=request_data.latitude,
        longitude=request_data.longitude
    )

    db.add(new_request)
    try:
        db.commit()
        db.refresh(new_request)
    except IntegrityError:
        db.rollback()
        raise ValueError("Selected disaster does not exist")

    logger.info(
        "Relief request created: request_id=%s victim_id=%s disaster_id=%s",
        new_request.id,
        new_request.victim_id,
        new_request.disaster_id
    )

    return new_request


def create_assisted_relief_request(db, request_data):
    victim = db.query(User).filter(
        User.id == request_data.victim_id
    ).first()

    if victim is None:
        raise ValueError("Victim not found")

    if victim.role != "victim":
        raise ValueError("Selected user is not a victim")

    _validate_active_disaster(db, request_data.disaster_id)

    new_request = ReliefRequest(
        victim_id=request_data.victim_id,
        disaster_id=request_data.disaster_id,
        request_type=request_data.request_type,
        description=request_data.description,
        location=request_data.location,
        priority=request_data.priority,
        request_source="assisted",
        latitude=request_data.latitude,
        longitude=request_data.longitude
    )

    db.add(new_request)
    try:
        db.commit()
        db.refresh(new_request)
    except IntegrityError:
        db.rollback()
        raise ValueError("Selected disaster does not exist")

    logger.info(
        "Assisted relief request created: request_id=%s victim_id=%s disaster_id=%s",
        new_request.id,
        new_request.victim_id,
        new_request.disaster_id
    )

    return new_request


def create_guest_relief_request(db, request_data):
    _validate_active_disaster(db, request_data.disaster_id)

    new_request = ReliefRequest(
        victim_id=None,
        disaster_id=request_data.disaster_id,
        request_type=request_data.request_type,
        description=request_data.description,
        location=request_data.location,
        priority=request_data.priority,
        request_source="guest",
        phone=request_data.phone,
        latitude=request_data.latitude,
        longitude=request_data.longitude
    )

    db.add(new_request)
    try:
        db.commit()
        db.refresh(new_request)
    except IntegrityError:
        db.rollback()
        raise ValueError("Selected disaster does not exist")

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
    role=current_user.get("role")
    user_id=current_user.get("user_id")

    if role=="admin":
        return db.query(ReliefRequest).filter(
            ReliefRequest.id==request_id
        ).first()

    if role=="volunteer":
        volunteer=db.query(Volunteer).filter(
            Volunteer.user_id==user_id
        ).first()
        if volunteer is not None:
            assignment=db.query(Assignment).filter(
                Assignment.relief_request_id==request_id,
                Assignment.volunteer_id==volunteer.id
            ).first()
            if assignment is not None:
                return db.query(ReliefRequest).filter(
                    ReliefRequest.id==request_id
                ).first()
        return None

    return db.query(ReliefRequest).filter(
        ReliefRequest.id==request_id,
        ReliefRequest.victim_id==user_id
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