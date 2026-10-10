from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.relief_request import ReliefRequest
from app.models.volunteer import Volunteer
from app.services.volunteer_matching_service import find_nearby_volunteers


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


class TestVolunteerMatchingService:

    def test_find_nearby_volunteers(self):
        db=get_test_db()

        request=ReliefRequest(
            victim_id=5,
            disaster_id=1,
            request_type="food",
            description="Need food",
            location="Trichy",
            priority="HIGH",
            request_source="victim",
            status="pending",
            latitude=10.728581,
            longitude=78.560176
        )

        volunteer1=Volunteer(
            user_id=6,
            skills="First Aid",
            availability="Available",
            latitude=10.728581,
            longitude=78.560176
        )

        volunteer2=Volunteer(
            user_id=7,
            skills="Rescue",
            availability="Available",
            latitude=10.738581,
            longitude=78.570176
        )

        volunteer3=Volunteer(
            user_id=8,
            skills="Food Distribution",
            availability="Unavailable",
            latitude=10.729581,
            longitude=78.561176
        )

        db.add_all([
            request,
            volunteer1,
            volunteer2,
            volunteer3
        ])

        db.commit()
        db.refresh(request)

        result=find_nearby_volunteers(
            db,
            request.id
        )

        assert result is not None
        assert len(result)==2

        assert result[0]["volunteer_id"]==volunteer1.id
        assert result[0]["distance_km"]==0.0

        assert result[1]["volunteer_id"]==volunteer2.id
        assert result[1]["distance_km"]>0

        db.close()


    def test_request_not_found(self):
        db=get_test_db()

        result=find_nearby_volunteers(
            db,
            999
        )

        assert result is None

        db.close()


    def test_request_without_gps(self):
        db=get_test_db()

        request=ReliefRequest(
            victim_id=5,
            disaster_id=1,
            request_type="food",
            description="Need food",
            location="Trichy",
            priority="HIGH",
            request_source="victim",
            status="pending"
        )

        db.add(request)
        db.commit()
        db.refresh(request)

        result=find_nearby_volunteers(
            db,
            request.id
        )

        assert result==[]

        db.close()