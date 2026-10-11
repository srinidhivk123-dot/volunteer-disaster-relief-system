"""
ReliefConnect Comprehensive Test Suite
Validates all 17 required scenarios:
1. Admin login success.
2. Volunteer login success.
3. Victim login success.
4. Victim attempting admin login rejected (403).
5. Victim attempting volunteer login rejected (403).
6. Volunteer attempting admin login rejected (403).
7. Invalid credentials rejected (401).
8. Public registration cannot create admin (400).
9. Protected endpoints reject unauthorized roles (403).
10. Active disasters returned correctly.
11. Empty active-disaster list handled gracefully.
12. Guest request works without login & without GPS.
13. Guest request saves GPS when supplied.
14. Victim creates and views own requests (isolated from others).
15. Volunteer views and updates assigned requests.
16. Admin views and assigns requests.
17. Migration script checks safely and skips existing columns.
"""
import pytest
from app.models.user import User
from app.models.disaster import Disaster
from app.models.volunteer import Volunteer
from app.models.relief_request import ReliefRequest
from app.core.security import hash_password
from scripts.migrate import check_and_migrate


def create_user_helper(db, name, email, password, role):
    user = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if role == "volunteer":
        vol = Volunteer(
            user_id=user.id,
            skills="First Aid, Search & Rescue",
            availability="AVAILABLE"
        )
        db.add(vol)
        db.commit()
        db.refresh(vol)

    return user


def get_auth_token(client, email, password, role=None):
    endpoint = f"/auth/login/{role}" if role else "/auth/login"
    res = client.post(endpoint, json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed: {res.text}"
    return res.json()["access_token"]


class TestReliefConnectComprehensive:

    # 1. Admin login success
    def test_01_admin_login_success(self, client, db):
        create_user_helper(db, "System Admin", "admin@relief.test", "AdminSecret@123", "admin")
        
        # Portal login
        res = client.post("/auth/login/admin", json={"email": "admin@relief.test", "password": "AdminSecret@123"})
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["role"] == "admin"
        assert data["user_role"] == "admin"

        # Standard login
        res2 = client.post("/auth/login", json={"email": "admin@relief.test", "password": "AdminSecret@123"})
        assert res2.status_code == 200
        assert res2.json()["role"] == "admin"

    # 2. Volunteer login success
    def test_02_volunteer_login_success(self, client, db):
        create_user_helper(db, "Rescue Volunteer", "volunteer@relief.test", "VolPass@123", "volunteer")

        res = client.post("/auth/login/volunteer", json={"email": "volunteer@relief.test", "password": "VolPass@123"})
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["role"] == "volunteer"
        assert data["user_role"] == "volunteer"

    # 3. Victim login success
    def test_03_victim_login_success(self, client, db):
        create_user_helper(db, "Shelter Seeker", "victim@relief.test", "VicPass@123", "victim")

        res = client.post("/auth/login/victim", json={"email": "victim@relief.test", "password": "VicPass@123"})
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["role"] == "victim"
        assert data["user_role"] == "victim"

    # 4. Victim attempting admin login rejected (403)
    def test_04_victim_attempting_admin_login_rejected(self, client, db):
        create_user_helper(db, "Victim User", "victim_reject_admin@relief.test", "VicPass@123", "victim")

        res = client.post("/auth/login/admin", json={"email": "victim_reject_admin@relief.test", "password": "VicPass@123"})
        assert res.status_code == 403
        detail = res.json()["detail"]
        assert "Admins only" in detail
        assert "a Victim" in detail

    # 5. Victim attempting volunteer login rejected (403)
    def test_05_victim_attempting_volunteer_login_rejected(self, client, db):
        create_user_helper(db, "Victim User", "victim_reject_vol@relief.test", "VicPass@123", "victim")

        res = client.post("/auth/login/volunteer", json={"email": "victim_reject_vol@relief.test", "password": "VicPass@123"})
        assert res.status_code == 403
        detail = res.json()["detail"]
        assert "Volunteers only" in detail
        assert "a Victim" in detail

    # 6. Volunteer attempting admin login rejected (403)
    def test_06_volunteer_attempting_admin_login_rejected(self, client, db):
        create_user_helper(db, "Volunteer User", "vol_reject_admin@relief.test", "VolPass@123", "volunteer")

        res = client.post("/auth/login/admin", json={"email": "vol_reject_admin@relief.test", "password": "VolPass@123"})
        assert res.status_code == 403
        detail = res.json()["detail"]
        assert "Admins only" in detail
        assert "a Volunteer" in detail

    # 7. Invalid credentials rejected (401)
    def test_07_invalid_credentials_rejected(self, client, db):
        create_user_helper(db, "Valid Admin", "admin_creds@relief.test", "CorrectPassword@123", "admin")

        # Wrong password
        res = client.post("/auth/login/admin", json={"email": "admin_creds@relief.test", "password": "WrongPassword"})
        assert res.status_code == 401
        assert "Invalid email or password" in res.json()["detail"]

        # Non-existent email
        res2 = client.post("/auth/login/volunteer", json={"email": "nonexistent@relief.test", "password": "AnyPassword@123"})
        assert res2.status_code == 401

    # 8. Public registration cannot create admin (400)
    def test_08_public_registration_cannot_create_admin(self, client, db):
        res = client.post("/auth/register", json={
            "name": "Malicious Admin Attempter",
            "email": "hacker_admin@relief.test",
            "password": "Password@123",
            "role": "admin"
        })
        assert res.status_code == 400
        assert "administrator registration is not permitted" in res.json()["detail"].lower()

    # 9. Protected endpoints reject unauthorized roles (403)
    def test_09_protected_endpoints_reject_unauthorized_roles(self, client, db):
        create_user_helper(db, "Victim User", "vic_auth@relief.test", "Pass@123", "victim")
        create_user_helper(db, "Volunteer User", "vol_auth@relief.test", "Pass@123", "volunteer")

        victim_token = get_auth_token(client, "vic_auth@relief.test", "Pass@123", "victim")
        vol_token = get_auth_token(client, "vol_auth@relief.test", "Pass@123", "volunteer")

        # Victim cannot POST /disasters/ (admin only)
        res_vic = client.post(
            "/disasters/",
            json={"name": "Flood Alpha", "disaster_type": "FLOOD", "location": "Sector 4", "description": "High waters"},
            headers={"Authorization": f"Bearer {victim_token}"}
        )
        assert res_vic.status_code == 403

        # Volunteer cannot POST /disasters/ (admin only)
        res_vol = client.post(
            "/disasters/",
            json={"name": "Flood Alpha", "disaster_type": "FLOOD", "location": "Sector 4", "description": "High waters"},
            headers={"Authorization": f"Bearer {vol_token}"}
        )
        assert res_vol.status_code == 403

        # Unauthenticated request to /relief-requests/my rejected (401)
        res_unauth = client.get("/relief-requests/my")
        assert res_unauth.status_code == 401

    # 10. Active disasters returned correctly
    def test_10_active_disasters_returned_correctly(self, client, db):
        d1 = Disaster(name="Coastal Cyclone", disaster_type="Cyclone", location="East Coast", description="Heavy storm", status="ACTIVE")
        d2 = Disaster(name="Resolved Landslide", disaster_type="Landslide", location="Hill Station", description="Cleared road", status="RESOLVED")
        db.add_all([d1, d2])
        db.commit()

        res = client.get("/disasters/active")
        assert res.status_code == 200
        disasters = res.json()
        assert len(disasters) == 1
        assert disasters[0]["name"] == "Coastal Cyclone"
        assert disasters[0]["status"].lower() == "active"

    # 11. Empty active-disaster list handled gracefully
    def test_11_empty_active_disaster_list_handled_gracefully(self, client, db):
        res = client.get("/disasters/active")
        assert res.status_code == 200
        assert res.json() == []

    # 12. Guest request works without login & without GPS
    def test_12_guest_request_works_without_login_and_without_gps(self, client, db):
        payload = {
            "description": "Urgent emergency rescue needed near main square",
            "request_type": "rescue",
            "location": "Main Square",
            "priority": "HIGH",
            "phone": "9876543210"
        }
        res = client.post("/relief-requests/guest", json=payload)
        assert res.status_code in [200, 201]
        data = res.json()
        assert "id" in data
        assert data["request_source"] == "guest"
        assert data["status"].lower() == "pending"
        assert data["latitude"] is None
        assert data["longitude"] is None
        assert data["phone"] == "9876543210"

    # 13. Guest request saves GPS when supplied
    def test_13_guest_request_saves_gps_when_supplied(self, client, db):
        payload = {
            "description": "Trapped in flood waters with coordinates",
            "request_type": "rescue",
            "location": "River Bank",
            "priority": "HIGH",
            "latitude": 13.0827,
            "longitude": 80.2707,
            "phone": "9123456780"
        }
        res = client.post("/relief-requests/guest", json=payload)
        assert res.status_code in [200, 201]
        data = res.json()
        assert data["latitude"] == pytest.approx(13.0827, abs=1e-4)
        assert data["longitude"] == pytest.approx(80.2707, abs=1e-4)
        assert data["request_source"] == "guest"

    # 14. Victim creates and views own requests (isolated from other victims)
    def test_14_victim_creates_and_views_own_requests(self, client, db):
        v1 = create_user_helper(db, "Victim One", "vic1@relief.test", "Pass@123", "victim")
        v2 = create_user_helper(db, "Victim Two", "vic2@relief.test", "Pass@123", "victim")

        token1 = get_auth_token(client, "vic1@relief.test", "Pass@123", "victim")
        token2 = get_auth_token(client, "vic2@relief.test", "Pass@123", "victim")

        # Victim 1 creates request without disaster
        res1 = client.post(
            "/relief-requests/",
            json={"description": "Food rations needed", "request_type": "food", "location": "Camp A", "priority": "MEDIUM"},
            headers={"Authorization": f"Bearer {token1}"}
        )
        assert res1.status_code in [200, 201]
        r1_id = res1.json()["id"]

        # Victim 1 sees their request
        my_res1 = client.get("/relief-requests/my", headers={"Authorization": f"Bearer {token1}"})
        assert my_res1.status_code == 200
        ids1 = [r["id"] for r in my_res1.json()]
        assert r1_id in ids1

        # Victim 2 does NOT see Victim 1's request
        my_res2 = client.get("/relief-requests/my", headers={"Authorization": f"Bearer {token2}"})
        assert my_res2.status_code == 200
        ids2 = [r["id"] for r in my_res2.json()]
        assert r1_id not in ids2

    # 15. Volunteer views and updates assigned requests
    def test_15_volunteer_views_and_updates_assigned_requests(self, client, db):
        vol_user = create_user_helper(db, "Field Volunteer", "field_vol@relief.test", "Pass@123", "volunteer")
        vol_profile = db.query(Volunteer).filter(Volunteer.user_id == vol_user.id).first()
        token = get_auth_token(client, "field_vol@relief.test", "Pass@123", "volunteer")

        # Create a pending request
        req = ReliefRequest(
            description="Medical first aid kit required",
            request_type="medical",
            location="Zone B",
            priority="HIGH",
            request_source="guest",
            status="pending"
        )
        db.add(req)
        db.commit()
        db.refresh(req)

        # Volunteer self-assigns request
        assign_res = client.post(
            "/assignments/",
            json={"relief_request_id": req.id, "volunteer_id": vol_profile.id},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert assign_res.status_code == 200
        assignment_id = assign_res.json()["id"]

        # Volunteer updates assignment status to "in_progress"
        up_res1 = client.patch(
            f"/assignments/{assignment_id}/status",
            json={"status": "in_progress"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert up_res1.status_code == 200
        assert up_res1.json()["status"] == "in_progress"

        # Volunteer updates to "completed"
        up_res2 = client.patch(
            f"/assignments/{assignment_id}/status",
            json={"status": "completed"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert up_res2.status_code == 200
        assert up_res2.json()["status"] == "completed"

    # 16. Admin views and assigns requests
    def test_16_admin_views_and_assigns_requests(self, client, db):
        create_user_helper(db, "System Admin", "admin_workflow@relief.test", "AdminPass@123", "admin")
        vol_user = create_user_helper(db, "Support Volunteer", "support_vol@relief.test", "VolPass@123", "volunteer")
        vol_profile = db.query(Volunteer).filter(Volunteer.user_id == vol_user.id).first()

        admin_token = get_auth_token(client, "admin_workflow@relief.test", "AdminPass@123", "admin")

        req = ReliefRequest(
            description="Evacuation boat needed",
            request_type="rescue",
            location="Flooded Avenue",
            priority="HIGH",
            request_source="guest",
            status="pending"
        )
        db.add(req)
        db.commit()
        db.refresh(req)

        # Admin views all requests
        all_reqs_res = client.get("/relief-requests/", headers={"Authorization": f"Bearer {admin_token}"})
        assert all_reqs_res.status_code == 200
        req_ids = [r["id"] for r in all_reqs_res.json()]
        assert req.id in req_ids

        # Admin assigns request to volunteer
        assign_res = client.post(
            "/assignments/",
            json={"relief_request_id": req.id, "volunteer_id": vol_profile.id},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert assign_res.status_code == 200
        assert assign_res.json()["volunteer_id"] == vol_profile.id

    # 17. Migration script checks safely and skips existing columns
    def test_17_migration_script_checks_safely_and_skips_existing_columns(self, db):
        # The db session's engine already has all tables created with full schema
        engine = db.get_bind()
        # Should detect all columns already present, perform 0 unsafe alterations, and return 0
        status = check_and_migrate(engine=engine, dry_run=True)
        assert status == 0
