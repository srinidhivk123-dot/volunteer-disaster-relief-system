from sqlalchemy.orm import Session

from app.models.disaster import Disaster
from app.schemas.disaster import (
    DisasterCreate,
    DisasterUpdate
)


ALLOWED_STATUSES = {
    "active",
    "inactive",
    "closed",
    "resolved"
}


def create_disaster(
    db: Session,
    disaster_data: DisasterCreate
):
    status = (disaster_data.status or "active").lower()
    if status not in ALLOWED_STATUSES:
        raise ValueError("Invalid disaster status")

    new_disaster = Disaster(
        name=disaster_data.name,
        disaster_type=disaster_data.disaster_type,
        description=disaster_data.description,
        location=disaster_data.location,
        status=status
    )

    db.add(new_disaster)
    db.commit()
    db.refresh(new_disaster)

    return new_disaster


def get_all_disasters(
    db: Session
):
    return (
        db.query(Disaster)
        .order_by(Disaster.id.desc())
        .all()
    )


def get_active_disasters(
    db: Session
):
    return (
        db.query(Disaster)
        .filter(
            Disaster.status.in_(["active", "ACTIVE"])
        )
        .order_by(Disaster.id.desc())
        .all()
    )



def get_disaster_by_id(
    db: Session,
    disaster_id: int
):
    return (
        db.query(Disaster)
        .filter(
            Disaster.id == disaster_id
        )
        .first()
    )


def update_disaster(
    db: Session,
    disaster_id: int,
    disaster_data: DisasterUpdate
):
    disaster = (
        db.query(Disaster)
        .filter(
            Disaster.id == disaster_id
        )
        .first()
    )

    if disaster is None:
        return None

    if disaster_data.status is not None:
        lowered_status = disaster_data.status.lower()
        if lowered_status not in ALLOWED_STATUSES:
            raise ValueError("Invalid disaster status")

    update_data = disaster_data.model_dump(
        exclude_unset=True
    )
    if "status" in update_data and update_data["status"] is not None:
        update_data["status"] = str(update_data["status"]).lower()

    for field, value in update_data.items():
        setattr(disaster, field, value)


    db.commit()
    db.refresh(disaster)

    return disaster


def delete_disaster(
    db: Session,
    disaster_id: int
):
    disaster = (
        db.query(Disaster)
        .filter(
            Disaster.id == disaster_id
        )
        .first()
    )

    if disaster is None:
        return None

    db.delete(disaster)
    db.commit()

    return disaster