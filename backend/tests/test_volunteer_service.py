from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.volunteer import Volunteer
from app.schemas.volunteer import VolunteerCreate
from app.services.volunteer_service import create_volunteer_profile
from app.services.volunteer_service import get_my_volunteer_profile
from app.services.volunteer_service import get_all_volunteers
from app.services.volunteer_service import update_my_volunteer_profile


def get_test_db():
    engine=create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread":False}
    )

    TestingSessionLocal=sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine
    )

    Base.metadata.create_all(bind=engine)

    return TestingSessionLocal()


class TestVolunteerService:

    def test_create_volunteer_profile(self):
        db=get_test_db()

        volunteer_data=VolunteerCreate(
            skills="First Aid, Rescue",
            availability="Available"
        )

        current_user={
            "user_id":4,
            "role":"volunteer"
        }

        result=create_volunteer_profile(
            db,
            volunteer_data,
            current_user
        )

        assert result.user_id==4
        assert result.skills=="First Aid, Rescue"
        assert result.availability=="Available"

        db.close()

    def test_create_volunteer_profile_duplicate(self):
        db=get_test_db()

        existing_volunteer=Volunteer(
            user_id=4,
            skills="First Aid",
            availability="Available"
        )

        db.add(existing_volunteer)
        db.commit()

        volunteer_data=VolunteerCreate(
            skills="Rescue",
            availability="Available"
        )

        current_user={
            "user_id":4,
            "role":"volunteer"
        }

        try:
            create_volunteer_profile(
                db,
                volunteer_data,
                current_user
            )
            assert False
        except ValueError as error:
            assert str(error)=="Volunteer profile already exists"

        db.close()

    def test_get_my_volunteer_profile(self):
        db=get_test_db()

        volunteer=Volunteer(
            user_id=4,
            skills="First Aid",
            availability="Available"
        )

        db.add(volunteer)
        db.commit()

        current_user={
            "user_id":4,
            "role":"volunteer"
        }

        result=get_my_volunteer_profile(
            db,
            current_user
        )

        assert result is not None
        assert result.user_id==4
        assert result.skills=="First Aid"
        assert result.availability=="Available"

        db.close()

    def test_get_my_volunteer_profile_not_found(self):
        db=get_test_db()

        current_user={
            "user_id":999,
            "role":"volunteer"
        }

        result=get_my_volunteer_profile(
            db,
            current_user
        )

        assert result is None

        db.close()

    def test_get_all_volunteers(self):
        db=get_test_db()

        volunteer1=Volunteer(
            user_id=4,
            skills="First Aid",
            availability="Available"
        )

        volunteer2=Volunteer(
            user_id=6,
            skills="Rescue",
            availability="Unavailable"
        )

        db.add_all([volunteer1,volunteer2])
        db.commit()

        result=get_all_volunteers(db)

        assert len(result)==2
        assert result[0].user_id==4
        assert result[1].user_id==6

        db.close()

    def test_update_my_volunteer_profile(self):
        db=get_test_db()

        volunteer=Volunteer(
            user_id=4,
            skills="First Aid",
            availability="Available"
        )

        db.add(volunteer)
        db.commit()
        db.refresh(volunteer)

        volunteer_data=VolunteerCreate(
            skills="First Aid, Rescue, Food Distribution",
            availability="Unavailable"
        )

        current_user={
            "user_id":4,
            "role":"volunteer"
        }

        result=update_my_volunteer_profile(
            db,
            volunteer_data,
            current_user
        )

        assert result is not None
        assert result.user_id==4
        assert result.skills=="First Aid, Rescue, Food Distribution"
        assert result.availability=="Unavailable"

        db.close()

    def test_update_my_volunteer_profile_not_found(self):
        db=get_test_db()

        volunteer_data=VolunteerCreate(
            skills="First Aid",
            availability="Available"
        )

        current_user={
            "user_id":999,
            "role":"volunteer"
        }

        result=update_my_volunteer_profile(
            db,
            volunteer_data,
            current_user
        )

        assert result is None

        db.close()