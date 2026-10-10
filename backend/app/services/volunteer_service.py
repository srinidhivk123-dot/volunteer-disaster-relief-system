from sqlalchemy.orm import Session

from app.models.volunteer import Volunteer
from app.schemas.volunteer import VolunteerCreate


def create_volunteer_profile(
    db: Session,
    volunteer_data: VolunteerCreate,
    current_user
):
    existing_volunteer = (
        db.query(Volunteer)
        .filter(
            Volunteer.user_id == current_user["user_id"]
        )
        .first()
    )

    if existing_volunteer is not None:
        raise ValueError("Volunteer profile already exists")

    new_volunteer = Volunteer(
        user_id=current_user["user_id"],
        skills=volunteer_data.skills,
        availability=volunteer_data.availability,
        latitude=volunteer_data.latitude,
        longitude=volunteer_data.longitude
    )

    db.add(new_volunteer)
    db.commit()
    db.refresh(new_volunteer)

    return new_volunteer


def get_my_volunteer_profile(
    db: Session,
    current_user
):
    return (
        db.query(Volunteer)
        .filter(
            Volunteer.user_id == current_user["user_id"]
        )
        .first()
    )


def get_all_volunteers(
    db: Session
):
    return db.query(Volunteer).order_by(
        Volunteer.id.asc()
    ).all()


def update_my_volunteer_profile(
    db: Session,
    volunteer_data: VolunteerCreate,
    current_user
):
    volunteer = (
        db.query(Volunteer)
        .filter(
            Volunteer.user_id == current_user["user_id"]
        )
        .first()
    )

    if volunteer is None:
        return None

    volunteer.skills = volunteer_data.skills
    volunteer.availability = volunteer_data.availability
    volunteer.latitude = volunteer_data.latitude
    volunteer.longitude = volunteer_data.longitude

    db.commit()
    db.refresh(volunteer)

    return volunteer