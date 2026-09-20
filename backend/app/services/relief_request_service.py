from sqlalchemy.orm import Session

from app.models.relief_request import ReliefRequest
from app.schemas.relief_request import ReliefRequestCreate


def create_relief_request(
    db: Session,
    request_data: ReliefRequestCreate
):
    new_request = ReliefRequest(
        victim_id=request_data.victim_id,
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
