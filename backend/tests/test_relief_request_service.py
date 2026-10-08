from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.assignment import Assignment
from app.models.relief_request import ReliefRequest
from app.models.user import User
from app.models.volunteer import Volunteer
from app.schemas.relief_request import (
    ReliefRequestCreate,
    GuestReliefRequestCreate,
    AssistedReliefRequestCreate,
    ReliefRequestStatusUpdate
)
from app.services.relief_request_service import (
    create_relief_request,
    create_guest_relief_request,
    create_assisted_relief_request,
    get_my_relief_requests,
    get_all_relief_requests,
    get_relief_request_by_id,
    update_relief_request_status
)


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


class TestReliefRequestService:

    def test_create_relief_request(self):
        db=get_test_db()

        request_data=ReliefRequestCreate(
            disaster_id=1,
            request_type="food",
            description="Need food",
            location="Trichy",
            priority="HIGH",
            request_source="victim"
        )

        current_user={
            "user_id":5,
            "role":"victim"
        }

        result=create_relief_request(
            db,
            request_data,
            current_user
        )

        assert result.id is not None
        assert result.victim_id==5
        assert result.disaster_id==1
        assert result.request_type=="food"
        assert result.priority=="HIGH"
        assert result.request_source=="victim"

        db.close()


    def test_create_guest_relief_request(self):
        db=get_test_db()

        request_data=GuestReliefRequestCreate(
            disaster_id=1,
            request_type="food",
            description="Need food and water",
            location="Trichy",
            priority="HIGH",
            phone="9876543210"
        )

        result=create_guest_relief_request(
            db,
            request_data
        )

        assert result.id is not None
        assert result.victim_id is None
        assert result.disaster_id==1
        assert result.request_type=="food"
        assert result.description=="Need food and water"
        assert result.location=="Trichy"
        assert result.priority=="HIGH"
        assert result.request_source=="guest"
        assert result.phone=="9876543210"
        assert result.status=="pending"

        db.close()


    def test_create_guest_relief_request_without_victim(self):
        db=get_test_db()

        request_data=GuestReliefRequestCreate(
            disaster_id=1,
            request_type="medical",
            description="Need medical assistance",
            location="Trichy",
            priority="HIGH",
            phone="9876543211"
        )

        result=create_guest_relief_request(
            db,
            request_data
        )

        assert result.victim_id is None
        assert result.request_source=="guest"
        assert result.phone=="9876543211"

        db.close()


    def test_create_assisted_relief_request(self):
        db=get_test_db()

        victim=User(
            name="Test Victim",
            email="victim@test.com",
            password_hash="hashed",
            role="victim"
        )

        db.add(victim)
        db.commit()
        db.refresh(victim)

        request_data=AssistedReliefRequestCreate(
            victim_id=victim.id,
            disaster_id=1,
            request_type="food",
            description="Need food",
            location="Trichy",
            priority="HIGH"
        )

        result=create_assisted_relief_request(
            db,
            request_data
        )

        assert result.id is not None
        assert result.victim_id==victim.id
        assert result.disaster_id==1
        assert result.request_type=="food"
        assert result.priority=="HIGH"
        assert result.request_source=="assisted"

        db.close()


    def test_create_assisted_relief_request_victim_not_found(self):
        db=get_test_db()

        request_data=AssistedReliefRequestCreate(
            victim_id=999,
            disaster_id=1,
            request_type="food",
            description="Need food",
            location="Trichy",
            priority="HIGH"
        )

        try:
            create_assisted_relief_request(
                db,
                request_data
            )
            assert False
        except ValueError as error:
            assert str(error)=="Victim not found"

        db.close()


    def test_create_assisted_relief_request_non_victim(self):
        db=get_test_db()

        volunteer=User(
            name="Test Volunteer",
            email="volunteer@test.com",
            password_hash="hashed",
            role="volunteer"
        )

        db.add(volunteer)
        db.commit()
        db.refresh(volunteer)

        request_data=AssistedReliefRequestCreate(
            victim_id=volunteer.id,
            disaster_id=1,
            request_type="food",
            description="Need food",
            location="Trichy",
            priority="HIGH"
        )

        try:
            create_assisted_relief_request(
                db,
                request_data
            )
            assert False
        except ValueError as error:
            assert str(error)=="Selected user is not a victim"

        db.close()


    def test_get_my_relief_requests(self):
        db=get_test_db()

        request1=ReliefRequest(
            victim_id=5,
            disaster_id=1,
            request_type="food",
            description="Need food",
            location="Trichy",
            priority="HIGH",
            request_source="victim",
            status="pending"
        )

        request2=ReliefRequest(
            victim_id=5,
            disaster_id=1,
            request_type="medical",
            description="Need medical help",
            location="Trichy",
            priority="HIGH",
            request_source="victim",
            status="pending"
        )

        other_request=ReliefRequest(
            victim_id=6,
            disaster_id=1,
            request_type="shelter",
            description="Need shelter",
            location="Trichy",
            priority="MEDIUM",
            request_source="victim",
            status="pending"
        )

        db.add_all([
            request1,
            request2,
            other_request
        ])
        db.commit()

        current_user={
            "user_id":5,
            "role":"victim"
        }

        result=get_my_relief_requests(
            db,
            current_user
        )

        assert len(result)==2
        assert result[0].victim_id==5
        assert result[1].victim_id==5
        assert result[0].id>result[1].id

        db.close()


    def test_get_all_relief_requests(self):
        db=get_test_db()

        request1=ReliefRequest(
            victim_id=5,
            disaster_id=1,
            request_type="food",
            description="Need food",
            location="Trichy",
            priority="HIGH",
            request_source="victim",
            status="pending"
        )

        request2=ReliefRequest(
            victim_id=6,
            disaster_id=1,
            request_type="medical",
            description="Need medical help",
            location="Trichy",
            priority="MEDIUM",
            request_source="victim",
            status="pending"
        )

        db.add_all([
            request1,
            request2
        ])
        db.commit()

        result=get_all_relief_requests(db)

        assert len(result)==2
        assert result[0].id>result[1].id

        db.close()


    def test_get_relief_request_by_id(self):
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

        current_user={
            "user_id":5,
            "role":"victim"
        }

        result=get_relief_request_by_id(
            db,
            request.id,
            current_user
        )

        assert result is not None
        assert result.id==request.id
        assert result.victim_id==5

        db.close()


    def test_get_relief_request_by_id_wrong_user(self):
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

        current_user={
            "user_id":999,
            "role":"victim"
        }

        result=get_relief_request_by_id(
            db,
            request.id,
            current_user
        )

        assert result is None

        db.close()


    def test_victim_can_cancel_pending_request(self):
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

        status_data=ReliefRequestStatusUpdate(
            status="cancelled"
        )

        current_user={
            "user_id":5,
            "role":"victim"
        }

        result=update_relief_request_status(
            db,
            request.id,
            status_data,
            current_user
        )

        assert result is not None
        assert result.status=="cancelled"

        db.close()


    def test_victim_cannot_complete_request(self):
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

        status_data=ReliefRequestStatusUpdate(
            status="completed"
        )

        current_user={
            "user_id":5,
            "role":"victim"
        }

        try:
            update_relief_request_status(
                db,
                request.id,
                status_data,
                current_user
            )
            assert False
        except PermissionError as error:
            assert str(error)=="Victims can only cancel their requests"

        db.close()


    def test_admin_can_assign_request(self):
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

        status_data=ReliefRequestStatusUpdate(
            status="assigned"
        )

        current_user={
            "user_id":1,
            "role":"admin"
        }

        result=update_relief_request_status(
            db,
            request.id,
            status_data,
            current_user
        )

        assert result is not None
        assert result.status=="assigned"

        db.close()


    def test_admin_can_cancel_request(self):
        db=get_test_db()

        request=ReliefRequest(
            victim_id=5,
            disaster_id=1,
            request_type="food",
            description="Need food",
            location="Trichy",
            priority="HIGH",
            request_source="victim",
            status="assigned"
        )

        db.add(request)
        db.commit()
        db.refresh(request)

        status_data=ReliefRequestStatusUpdate(
            status="cancelled"
        )

        current_user={
            "user_id":1,
            "role":"admin"
        }

        result=update_relief_request_status(
            db,
            request.id,
            status_data,
            current_user
        )

        assert result is not None
        assert result.status=="cancelled"

        db.close()


    def test_assigned_volunteer_can_start_request(self):
        db=get_test_db()

        user=User(
            name="Test Volunteer",
            email="volunteer@test.com",
            password_hash="hashed",
            role="volunteer"
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        volunteer=Volunteer(
            user_id=user.id,
            skills="rescue",
            availability="available"
        )

        db.add(volunteer)
        db.commit()
        db.refresh(volunteer)

        request=ReliefRequest(
            victim_id=5,
            disaster_id=1,
            request_type="rescue",
            description="Need rescue",
            location="Trichy",
            priority="HIGH",
            request_source="victim",
            status="assigned"
        )

        db.add(request)
        db.commit()
        db.refresh(request)

        assignment=Assignment(
            relief_request_id=request.id,
            volunteer_id=volunteer.id,
            status="assigned"
        )

        db.add(assignment)
        db.commit()

        status_data=ReliefRequestStatusUpdate(
            status="in_progress"
        )

        current_user={
            "user_id":user.id,
            "role":"volunteer"
        }

        result=update_relief_request_status(
            db,
            request.id,
            status_data,
            current_user
        )

        assert result is not None
        assert result.status=="in_progress"

        db.close()


    def test_assigned_volunteer_can_complete_request(self):
        db=get_test_db()

        user=User(
            name="Test Volunteer",
            email="volunteer2@test.com",
            password_hash="hashed",
            role="volunteer"
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        volunteer=Volunteer(
            user_id=user.id,
            skills="medical",
            availability="available"
        )

        db.add(volunteer)
        db.commit()
        db.refresh(volunteer)

        request=ReliefRequest(
            victim_id=5,
            disaster_id=1,
            request_type="medical",
            description="Need medical help",
            location="Trichy",
            priority="HIGH",
            request_source="victim",
            status="in_progress"
        )

        db.add(request)
        db.commit()
        db.refresh(request)

        assignment=Assignment(
            relief_request_id=request.id,
            volunteer_id=volunteer.id,
            status="in_progress"
        )

        db.add(assignment)
        db.commit()

        status_data=ReliefRequestStatusUpdate(
            status="completed"
        )

        current_user={
            "user_id":user.id,
            "role":"volunteer"
        }

        result=update_relief_request_status(
            db,
            request.id,
            status_data,
            current_user
        )

        assert result is not None
        assert result.status=="completed"

        db.close()


    def test_unassigned_volunteer_cannot_update_request(self):
        db=get_test_db()

        user=User(
            name="Other Volunteer",
            email="other@test.com",
            password_hash="hashed",
            role="volunteer"
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        volunteer=Volunteer(
            user_id=user.id,
            skills="rescue",
            availability="available"
        )

        db.add(volunteer)
        db.commit()
        db.refresh(volunteer)

        request=ReliefRequest(
            victim_id=5,
            disaster_id=1,
            request_type="rescue",
            description="Need rescue",
            location="Trichy",
            priority="HIGH",
            request_source="victim",
            status="assigned"
        )

        db.add(request)
        db.commit()
        db.refresh(request)

        status_data=ReliefRequestStatusUpdate(
            status="in_progress"
        )

        current_user={
            "user_id":user.id,
            "role":"volunteer"
        }

        try:
            update_relief_request_status(
                db,
                request.id,
                status_data,
                current_user
            )
            assert False
        except PermissionError as error:
            assert str(error)=="You can only update requests assigned to you"

        db.close()


    def test_invalid_relief_request_status(self):
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

        status_data=ReliefRequestStatusUpdate(
            status="invalid"
        )

        current_user={
            "user_id":1,
            "role":"admin"
        }

        try:
            update_relief_request_status(
                db,
                request.id,
                status_data,
                current_user
            )
            assert False
        except ValueError as error:
            assert str(error)=="Invalid relief request status"

        db.close()


    def test_invalid_status_transition(self):
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

        status_data=ReliefRequestStatusUpdate(
            status="completed"
        )

        current_user={
            "user_id":1,
            "role":"admin"
        }

        try:
            update_relief_request_status(
                db,
                request.id,
                status_data,
                current_user
            )
            assert False
        except ValueError as error:
            assert str(error)=="Invalid status transition"

        db.close()


    def test_update_relief_request_status_not_found(self):
        db=get_test_db()

        status_data=ReliefRequestStatusUpdate(
            status="completed"
        )

        current_user={
            "user_id":1,
            "role":"admin"
        }

        result=update_relief_request_status(
            db,
            999,
            status_data,
            current_user
        )

        assert result is None

        db.close()