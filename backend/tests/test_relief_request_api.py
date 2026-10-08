from app.main import app
from app.api.auth import get_db as auth_get_db
from app.api.relief_requests import get_db as relief_request_get_db

from app.models.user import User
from app.models.disaster import Disaster
from app.models.relief_request import ReliefRequest
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
    disaster_id,
    status="pending"
):
    request=ReliefRequest(
        victim_id=victim_id,
        disaster_id=disaster_id,
        request_type="food",
        description="Need food",
        location="Trichy",
        priority="HIGH",
        request_source="victim",
        status=status
    )

    db.add(request)
    db.commit()
    db.refresh(request)

    return request


class TestReliefRequestAPI:

    def setup_dependencies(self,db):
        app.dependency_overrides[auth_get_db]=override_get_db(db)
        app.dependency_overrides[
            relief_request_get_db
        ]=override_get_db(db)

    def teardown_dependencies(self):
        app.dependency_overrides.clear()

    def test_unauthorized_status_update_returns_403(self,db,client):
        try:
            victim=create_user(db,1,"victim")
            other_victim=create_user(db,2,"victim")
            disaster=create_disaster(db)

            request=create_relief_request(
                db,
                victim.id,
                disaster.id
            )

            token=create_access_token({
                "user_id":other_victim.id,
                "role":other_victim.role
            })

            self.setup_dependencies(db)

            response=client.patch(
                f"/relief-requests/{request.id}/status",
                json={"status":"cancelled"},
                headers={
                    "Authorization":f"Bearer {token}"
                }
            )

            assert response.status_code==403

        finally:
            self.teardown_dependencies()

    def test_invalid_status_returns_400(self,db,client):
        try:
            victim=create_user(db,1,"victim")
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

            response=client.patch(
                f"/relief-requests/{request.id}/status",
                json={"status":"invalid_status"},
                headers={
                    "Authorization":f"Bearer {token}"
                }
            )

            assert response.status_code==400

        finally:
            self.teardown_dependencies()

    def test_missing_request_returns_404(self,db,client):
        try:
            victim=create_user(db,1,"victim")

            token=create_access_token({
                "user_id":victim.id,
                "role":victim.role
            })

            self.setup_dependencies(db)

            response=client.patch(
                "/relief-requests/9999/status",
                json={"status":"cancelled"},
                headers={
                    "Authorization":f"Bearer {token}"
                }
            )

            assert response.status_code==404

        finally:
            self.teardown_dependencies()

    def test_victim_can_cancel_request(self,db,client):
        try:
            victim=create_user(db,1,"victim")
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

            response=client.patch(
                f"/relief-requests/{request.id}/status",
                json={"status":"cancelled"},
                headers={
                    "Authorization":f"Bearer {token}"
                }
            )

            assert response.status_code==200
            assert response.json()["status"]=="cancelled"

        finally:
            self.teardown_dependencies()