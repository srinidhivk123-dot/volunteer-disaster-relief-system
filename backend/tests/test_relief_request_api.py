from app.main import app
from app.api.auth import get_db as auth_get_db
from app.api.relief_requests import get_db as relief_request_get_db
from app.api.disasters import get_db as disaster_get_db

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
        app.dependency_overrides[relief_request_get_db]=override_get_db(db)
        app.dependency_overrides[disaster_get_db]=override_get_db(db)

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

    def test_admin_creates_disaster_and_guest_retrieves_active(self, db, client):
        try:
            admin = create_user(db, 10, "admin")
            admin_token = create_access_token({
                "user_id": admin.id,
                "role": admin.role
            })
            self.setup_dependencies(db)

            # 1. Admin creates active disaster
            create_resp = client.post(
                "/disasters/",
                json={
                    "name": "Wayanad Landslide Relief",
                    "disaster_type": "landslide",
                    "description": "Emergency hillside relief effort",
                    "location": "Wayanad, Kerala",
                    "status": "active"
                },
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert create_resp.status_code == 200
            disaster_data = create_resp.json()
            assert disaster_data["name"] == "Wayanad Landslide Relief"
            assert disaster_data["status"] == "active"
            disaster_id = disaster_data["id"]

            # 2. Public unauthenticated guest retrieves active disasters
            active_resp = client.get("/disasters/active")
            assert active_resp.status_code == 200
            active_list = active_resp.json()
            assert len(active_list) >= 1
            assert any(d["id"] == disaster_id and d["status"] == "active" for d in active_list)
        finally:
            self.teardown_dependencies()

    def test_guest_submits_request_with_active_disaster(self, db, client):
        try:
            disaster = create_disaster(db)
            self.setup_dependencies(db)

            resp = client.post(
                "/relief-requests/guest",
                json={
                    "disaster_id": disaster.id,
                    "request_type": "medical",
                    "description": "Immediate first aid kit and oxygen needed",
                    "location": "Flood Relief Camp #4",
                    "priority": "HIGH",
                    "phone": "+91 9876543210",
                    "latitude": 11.2588,
                    "longitude": 75.7804
                }
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["disaster_id"] == disaster.id
            assert data["victim_id"] is None
            assert data["request_source"] == "guest"
            assert data["status"] == "pending"
        finally:
            self.teardown_dependencies()

    def test_victim_submits_request_with_active_disaster(self, db, client):
        try:
            victim = create_user(db, 20, "victim")
            disaster = create_disaster(db)
            token = create_access_token({
                "user_id": victim.id,
                "role": victim.role
            })
            self.setup_dependencies(db)

            resp = client.post(
                "/relief-requests/",
                json={
                    "disaster_id": disaster.id,
                    "request_type": "food",
                    "description": "Clean drinking water and dry food packets",
                    "location": "Main Road Junction",
                    "priority": "MEDIUM",
                    "request_source": "victim",
                    "latitude": 11.2500,
                    "longitude": 75.7700
                },
                headers={"Authorization": f"Bearer {token}"}
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["disaster_id"] == disaster.id
            assert data["victim_id"] == victim.id
            assert data["request_source"] == "victim"
            assert data["status"] == "pending"
        finally:
            self.teardown_dependencies()

    def test_guest_request_with_nonexistent_disaster_fails(self, db, client):
        try:
            create_disaster(db)
            self.setup_dependencies(db)

            resp = client.post(
                "/relief-requests/guest",
                json={
                    "disaster_id": 99999,
                    "request_type": "food",
                    "description": "Non-existent disaster test",
                    "location": "Nowhere",
                    "priority": "LOW",
                    "phone": "9876543210"
                }
            )
            assert resp.status_code == 400
            assert "Selected disaster does not exist" in resp.json()["detail"]
        finally:
            self.teardown_dependencies()