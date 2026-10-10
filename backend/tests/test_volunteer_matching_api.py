from app.main import app
from app.api.auth import get_db as auth_get_db
from app.api.volunteers import get_db as volunteer_get_db

from app.models.user import User
from app.models.disaster import Disaster
from app.models.relief_request import ReliefRequest
from app.models.volunteer import Volunteer
from app.core.security import create_access_token


def override_get_db(db):
    def dependency():
        yield db

    return dependency


def create_user(db,user_id,role):
    user=User(
        id=user_id,
        name=f"User {user_id}",
        email=f"user{user_id}@test.com",
        password_hash="test_hash",
        role=role
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def create_disaster(db):
    disaster=Disaster(
        name="Test Flood",
        disaster_type="flood",
        description="Test disaster",
        location="Trichy",
        status="active"
    )

    db.add(disaster)
    db.commit()
    db.refresh(disaster)

    return disaster


def create_relief_request(
    db,
    victim_id,
    disaster_id
):
    request=ReliefRequest(
        victim_id=victim_id,
        disaster_id=disaster_id,
        request_type="food",
        description="Need food",
        location="Trichy",
        priority="HIGH",
        request_source="victim",
        status="pending",
        latitude=10.728581,
        longitude=78.560176
    )

    db.add(request)
    db.commit()
    db.refresh(request)

    return request


class TestVolunteerMatchingAPI:

    def setup_dependencies(self,db):
        app.dependency_overrides[auth_get_db]=override_get_db(db)
        app.dependency_overrides[
            volunteer_get_db
        ]=override_get_db(db)

    def teardown_dependencies(self):
        app.dependency_overrides.clear()

    def test_admin_can_get_nearby_volunteers(
        self,
        db,
        client
    ):
        try:
            admin=create_user(
                db,
                1,
                "admin"
            )

            victim=create_user(
                db,
                2,
                "victim"
            )

            disaster=create_disaster(db)

            request=create_relief_request(
                db,
                victim.id,
                disaster.id
            )

            volunteer=Volunteer(
                user_id=3,
                skills="First Aid",
                availability="Available",
                latitude=10.728581,
                longitude=78.560176
            )

            unavailable_volunteer=Volunteer(
                user_id=4,
                skills="Rescue",
                availability="Unavailable",
                latitude=10.729581,
                longitude=78.561176
            )

            db.add_all([
                volunteer,
                unavailable_volunteer
            ])
            db.commit()
            db.refresh(volunteer)

            token=create_access_token({
                "user_id":admin.id,
                "role":admin.role
            })

            self.setup_dependencies(db)

            response=client.get(
                f"/volunteers/nearby/{request.id}",
                headers={
                    "Authorization":f"Bearer {token}"
                }
            )

            assert response.status_code==200

            data=response.json()

            assert len(data)==1
            assert data[0]["volunteer_id"]==volunteer.id
            assert data[0]["skills"]=="First Aid"
            assert data[0]["availability"]=="Available"
            assert data[0]["distance_km"]==0

        finally:
            self.teardown_dependencies()

    def test_non_admin_cannot_get_nearby_volunteers(
        self,
        db,
        client
    ):
        try:
            victim=create_user(
                db,
                1,
                "victim"
            )

            disaster=create_disaster(db)

            request=create_relief_request(
                db,
                victim.id,
                disaster.id
            )

            token=create_access_token({
                "user_id":victim.id,
                "role":victim.role
            })

            self.setup_dependencies(db)

            response=client.get(
                f"/volunteers/nearby/{request.id}",
                headers={
                    "Authorization":f"Bearer {token}"
                }
            )

            assert response.status_code==403

        finally:
            self.teardown_dependencies()

    def test_missing_relief_request_returns_404(
        self,
        db,
        client
    ):
        try:
            admin=create_user(
                db,
                1,
                "admin"
            )

            token=create_access_token({
                "user_id":admin.id,
                "role":admin.role
            })

            self.setup_dependencies(db)

            response=client.get(
                "/volunteers/nearby/9999",
                headers={
                    "Authorization":f"Bearer {token}"
                }
            )

            assert response.status_code==404

        finally:
            self.teardown_dependencies()