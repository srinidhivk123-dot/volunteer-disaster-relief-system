import pytest
from app.models.user import User
from app.models.disaster import Disaster
from app.core.security import create_access_token


class TestDisasterAPI:

    @pytest.fixture(autouse=True)
    def setup_api(self, db, client):
        self.db = db
        self.client = client

        # Create admin user
        self.admin = User(
            id=10,
            name="Incident Commander",
            email="admin@cmd.org",
            password_hash="hashed_pw",
            role="admin"
        )
        # Create victim user
        self.victim = User(
            id=20,
            name="Disaster Victim",
            email="victim@domain.org",
            password_hash="hashed_pw",
            role="victim"
        )
        self.db.add_all([self.admin, self.victim])
        self.db.commit()

        self.admin_token = create_access_token({"user_id": self.admin.id, "role": "admin"})
        self.victim_token = create_access_token({"user_id": self.victim.id, "role": "victim"})

    def test_admin_can_create_disaster(self):
        payload = {
            "name": "Kerala Monsoon Floods 2026",
            "disaster_type": "flood",
            "location": "Wayanad District, Kerala",
            "description": "Severe flooding and landslides across northern districts.",
            "status": "active"
        }
        res = self.client.post(
            "/disasters/",
            json=payload,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["id"] is not None
        assert data["name"] == payload["name"]
        assert data["disaster_type"] == "flood"
        assert data["status"] == "active"

    def test_non_admin_cannot_create_disaster(self):
        payload = {
            "name": "Unauthorized Incident",
            "disaster_type": "fire",
            "location": "City Center",
            "status": "active"
        }
        res = self.client.post(
            "/disasters/",
            json=payload,
            headers={"Authorization": f"Bearer {self.victim_token}"}
        )
        assert res.status_code == 403

    def test_unauthenticated_cannot_create_disaster(self):
        payload = {
            "name": "Unauthenticated Incident",
            "disaster_type": "fire",
            "location": "City Center",
            "status": "active"
        }
        res = self.client.post("/disasters/", json=payload)
        assert res.status_code == 401

    def test_admin_can_update_and_activate_disaster(self):
        disaster = Disaster(
            name="Cyclone Vardah",
            disaster_type="cyclone",
            location="Chennai Coastal Region",
            status="inactive"
        )
        self.db.add(disaster)
        self.db.commit()
        self.db.refresh(disaster)

        # Verify not yet active
        active_res = self.client.get("/disasters/active")
        assert active_res.status_code == 200
        assert not any(d["id"] == disaster.id for d in active_res.json())

        # Admin activates the disaster
        update_res = self.client.put(
            f"/disasters/{disaster.id}",
            json={"status": "active"},
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert update_res.status_code == 200
        assert update_res.json()["status"] == "active"

        # Now appears in public active listing
        active_res2 = self.client.get("/disasters/active")
        assert active_res2.status_code == 200
        assert any(d["id"] == disaster.id for d in active_res2.json())

    def test_non_admin_cannot_update_disaster(self):
        disaster = Disaster(
            name="Test Earthquake",
            disaster_type="earthquake",
            location="Kachchh",
            status="active"
        )
        self.db.add(disaster)
        self.db.commit()
        self.db.refresh(disaster)

        res = self.client.put(
            f"/disasters/{disaster.id}",
            json={"status": "resolved"},
            headers={"Authorization": f"Bearer {self.victim_token}"}
        )
        assert res.status_code == 403

    def test_get_active_disasters_is_public_and_returns_only_active(self):
        d_active = Disaster(name="Active Event", disaster_type="flood", location="Loc A", status="active")
        d_resolved = Disaster(name="Resolved Event", disaster_type="fire", location="Loc B", status="resolved")
        self.db.add_all([d_active, d_resolved])
        self.db.commit()

        res = self.client.get("/disasters/active")
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 1
        assert data[0]["name"] == "Active Event"

    def test_get_all_disasters_requires_auth(self):
        res_unauth = self.client.get("/disasters/")
        assert res_unauth.status_code == 401

        res_auth = self.client.get(
            "/disasters/",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert res_auth.status_code == 200
        assert isinstance(res_auth.json(), list)

    def test_admin_can_delete_disaster(self):
        disaster = Disaster(name="Temp", disaster_type="flood", location="Loc", status="resolved")
        self.db.add(disaster)
        self.db.commit()
        self.db.refresh(disaster)

        del_res = self.client.delete(
            f"/disasters/{disaster.id}",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert del_res.status_code == 200

        get_res = self.client.get(
            f"/disasters/{disaster.id}",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert get_res.status_code == 404

    def test_create_disaster_invalid_status_returns_400(self):
        payload = {
            "name": "Bad Status",
            "disaster_type": "flood",
            "location": "Loc",
            "status": "bogus_status"
        }
        res = self.client.post(
            "/disasters/",
            json=payload,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert res.status_code == 400
        assert "Invalid disaster status" in res.json()["detail"]

    def test_end_to_end_disaster_creation_and_guest_relief_request(self):
        # 1. Admin creates active disaster
        d_res = self.client.post(
            "/disasters/",
            json={
                "name": "Assam Flood Relief 2026",
                "disaster_type": "flood",
                "location": "Guwahati",
                "description": "High water levels across Brahmaputra valley",
                "status": "active"
            },
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert d_res.status_code == 200
        disaster_id = d_res.json()["id"]

        # 2. Public active listing includes new disaster
        active_res = self.client.get("/disasters/active")
        assert active_res.status_code == 200
        active_ids = [d["id"] for d in active_res.json()]
        assert disaster_id in active_ids

        # 3. Guest submits relief request linked to this real active disaster ID
        req_res = self.client.post(
            "/relief-requests/guest",
            json={
                "disaster_id": disaster_id,
                "request_type": "rescue",
                "description": "Trapped on roof with elderly parents",
                "location": "Near Guwahati Stadium",
                "priority": "HIGH",
                "phone": "+919876543210",
                "latitude": 26.1445,
                "longitude": 91.7362
            }
        )
        assert req_res.status_code == 200
        req_data = req_res.json()
        assert req_data["id"] is not None
        assert req_data["disaster_id"] == disaster_id
        assert req_data["request_source"] == "guest"
        assert req_data["status"] == "pending"
