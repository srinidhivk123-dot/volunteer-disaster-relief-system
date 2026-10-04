from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.assignment import Assignment
from app.models.relief_request import ReliefRequest
from app.models.volunteer import Volunteer
from app.schemas.assignment import AssignmentCreate
from app.services.assignment_service import create_assignment
from app.services.assignment_service import get_assignment_by_id
from app.services.assignment_service import get_all_assignments
from app.services.assignment_service import update_assignment_status


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


class TestAssignmentService:

    def test_create_assignment(self):
        db=get_test_db()

        relief_request=ReliefRequest(
            victim_id=5,
            disaster_id=1,
            request_type="food",
            description="Need food",
            location="Trichy",
            priority="HIGH",
            request_source="victim",
            status="pending"
        )

        volunteer=Volunteer(
            user_id=4,
            skills="First Aid",
            availability="Available"
        )

        db.add_all([relief_request,volunteer])
        db.commit()
        db.refresh(relief_request)
        db.refresh(volunteer)

        assignment_data=AssignmentCreate(
            relief_request_id=relief_request.id,
            volunteer_id=volunteer.id
        )

        result=create_assignment(db,assignment_data)

        assert result.relief_request_id==relief_request.id
        assert result.volunteer_id==volunteer.id
        assert result.status=="assigned"

        db.close()

    def test_create_assignment_relief_request_not_found(self):
        db=get_test_db()

        volunteer=Volunteer(
            user_id=4,
            skills="First Aid",
            availability="Available"
        )

        db.add(volunteer)
        db.commit()
        db.refresh(volunteer)

        assignment_data=AssignmentCreate(
            relief_request_id=999,
            volunteer_id=volunteer.id
        )

        try:
            create_assignment(db,assignment_data)
            assert False
        except ValueError as error:
            assert str(error)=="Relief request not found"

        db.close()

    def test_create_assignment_volunteer_not_found(self):
        db=get_test_db()

        relief_request=ReliefRequest(
            victim_id=5,
            disaster_id=1,
            request_type="food",
            description="Need food",
            location="Trichy",
            priority="HIGH",
            request_source="victim",
            status="pending"
        )

        db.add(relief_request)
        db.commit()
        db.refresh(relief_request)

        assignment_data=AssignmentCreate(
            relief_request_id=relief_request.id,
            volunteer_id=999
        )

        try:
            create_assignment(db,assignment_data)
            assert False
        except ValueError as error:
            assert str(error)=="Volunteer not found"

        db.close()

    def test_create_assignment_duplicate(self):
        db=get_test_db()

        relief_request=ReliefRequest(
            victim_id=5,
            disaster_id=1,
            request_type="food",
            description="Need food",
            location="Trichy",
            priority="HIGH",
            request_source="victim",
            status="pending"
        )

        volunteer=Volunteer(
            user_id=4,
            skills="First Aid",
            availability="Available"
        )

        db.add_all([relief_request,volunteer])
        db.commit()
        db.refresh(relief_request)
        db.refresh(volunteer)

        existing_assignment=Assignment(
            relief_request_id=relief_request.id,
            volunteer_id=volunteer.id,
            status="assigned"
        )

        db.add(existing_assignment)
        db.commit()

        assignment_data=AssignmentCreate(
            relief_request_id=relief_request.id,
            volunteer_id=volunteer.id
        )

        try:
            create_assignment(db,assignment_data)
            assert False
        except ValueError as error:
            assert str(error)=="Relief request already assigned"

        db.close()

    def test_get_assignment_by_id_admin(self):
        db=get_test_db()

        assignment=Assignment(
            relief_request_id=1,
            volunteer_id=1,
            status="assigned"
        )

        db.add(assignment)
        db.commit()
        db.refresh(assignment)

        current_user={
            "user_id":7,
            "role":"admin"
        }

        result=get_assignment_by_id(
            db,
            assignment.id,
            current_user
        )

        assert result is not None
        assert result.id==assignment.id
        assert result.volunteer_id==1

        db.close()

    def test_get_assignment_by_id_volunteer(self):
        db=get_test_db()

        volunteer=Volunteer(
            user_id=4,
            skills="First Aid",
            availability="Available"
        )

        db.add(volunteer)
        db.commit()
        db.refresh(volunteer)

        assignment=Assignment(
            relief_request_id=1,
            volunteer_id=volunteer.id,
            status="assigned"
        )

        db.add(assignment)
        db.commit()
        db.refresh(assignment)

        current_user={
            "user_id":4,
            "role":"volunteer"
        }

        result=get_assignment_by_id(
            db,
            assignment.id,
            current_user
        )

        assert result is not None
        assert result.volunteer_id==volunteer.id

        db.close()

    def test_get_all_assignments_volunteer(self):
        db=get_test_db()

        volunteer=Volunteer(
            user_id=4,
            skills="First Aid",
            availability="Available"
        )

        other_volunteer=Volunteer(
            user_id=6,
            skills="Rescue",
            availability="Available"
        )

        db.add_all([volunteer,other_volunteer])
        db.commit()
        db.refresh(volunteer)
        db.refresh(other_volunteer)

        assignment1=Assignment(
            relief_request_id=1,
            volunteer_id=volunteer.id,
            status="assigned"
        )

        assignment2=Assignment(
            relief_request_id=2,
            volunteer_id=other_volunteer.id,
            status="assigned"
        )

        db.add_all([assignment1,assignment2])
        db.commit()

        current_user={
            "user_id":4,
            "role":"volunteer"
        }

        result=get_all_assignments(db,current_user)

        assert len(result)==1
        assert result[0].volunteer_id==volunteer.id

        db.close()

    def test_update_assignment_status_admin(self):
        db=get_test_db()

        assignment=Assignment(
            relief_request_id=1,
            volunteer_id=1,
            status="assigned"
        )

        db.add(assignment)
        db.commit()
        db.refresh(assignment)

        class StatusData:
            status="completed"

        current_user={
            "user_id":7,
            "role":"admin"
        }

        result=update_assignment_status(
            db,
            assignment.id,
            StatusData(),
            current_user
        )

        assert result is not None
        assert result.status=="completed"

        db.close()

    def test_update_assignment_status_volunteer(self):
        db=get_test_db()

        volunteer=Volunteer(
            user_id=4,
            skills="First Aid",
            availability="Available"
        )

        db.add(volunteer)
        db.commit()
        db.refresh(volunteer)

        assignment=Assignment(
            relief_request_id=1,
            volunteer_id=volunteer.id,
            status="assigned"
        )

        db.add(assignment)
        db.commit()
        db.refresh(assignment)

        class StatusData:
            status="in_progress"

        current_user={
            "user_id":4,
            "role":"volunteer"
        }

        result=update_assignment_status(
            db,
            assignment.id,
            StatusData(),
            current_user
        )

        assert result is not None
        assert result.status=="in_progress"

        db.close()

    def test_update_assignment_status_wrong_volunteer(self):
        db=get_test_db()

        volunteer=Volunteer(
            user_id=4,
            skills="First Aid",
            availability="Available"
        )

        db.add(volunteer)
        db.commit()
        db.refresh(volunteer)

        assignment=Assignment(
            relief_request_id=1,
            volunteer_id=volunteer.id,
            status="assigned"
        )

        db.add(assignment)
        db.commit()
        db.refresh(assignment)

        class StatusData:
            status="completed"

        current_user={
            "user_id":999,
            "role":"volunteer"
        }

        try:
            update_assignment_status(
                db,
                assignment.id,
                StatusData(),
                current_user
            )
            assert False
        except ValueError as error:
            assert str(error)=="Volunteer profile not found"

        db.close()

    def test_update_assignment_status_invalid_status(self):
        db=get_test_db()

        assignment=Assignment(
            relief_request_id=1,
            volunteer_id=1,
            status="assigned"
        )

        db.add(assignment)
        db.commit()
        db.refresh(assignment)

        class StatusData:
            status="invalid"

        current_user={
            "user_id":7,
            "role":"admin"
        }

        try:
            update_assignment_status(
                db,
                assignment.id,
                StatusData(),
                current_user
            )
            assert False
        except ValueError as error:
            assert str(error)=="Invalid assignment status"

        db.close()