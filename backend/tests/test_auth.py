class TestAuth:

    def test_register_user(self,client):
        email="authtest_unique@example.com"

        response=client.post(
            "/auth/register",
            json={
                "name":"Auth Test User",
                "email":email,
                "password":"TestPassword@123",
                "role":"victim"
            }
        )

        assert response.status_code==200

        data=response.json()

        assert data["message"]=="User registered successfully"
        assert "user_id" in data


    def test_register_duplicate_email(self,client):
        email="duplicateauth@example.com"

        first_response=client.post(
            "/auth/register",
            json={
                "name":"Duplicate Test User",
                "email":email,
                "password":"TestPassword@123",
                "role":"victim"
            }
        )

        assert first_response.status_code==200

        second_response=client.post(
            "/auth/register",
            json={
                "name":"Duplicate Test User 2",
                "email":email,
                "password":"TestPassword@123",
                "role":"victim"
            }
        )

        assert second_response.status_code==400
        assert second_response.json()["detail"]=="Email already registered"


    def test_login_success(self,client):
        email="logintest_unique@example.com"
        password="LoginPassword@123"

        register_response=client.post(
            "/auth/register",
            json={
                "name":"Login Test User",
                "email":email,
                "password":password,
                "role":"victim"
            }
        )

        assert register_response.status_code==200

        response=client.post(
            "/auth/login",
            json={
                "email":email,
                "password":password
            }
        )

        assert response.status_code==200

        data=response.json()

        assert data["message"]=="Login successful"
        assert "access_token" in data
        assert data["token_type"]=="bearer"


    def test_login_wrong_password(self,client):
        email="wrongpassword@example.com"
        password="CorrectPassword@123"

        register_response=client.post(
            "/auth/register",
            json={
                "name":"Wrong Password User",
                "email":email,
                "password":password,
                "role":"victim"
            }
        )

        assert register_response.status_code==200

        response=client.post(
            "/auth/login",
            json={
                "email":email,
                "password":"WrongPassword@123"
            }
        )

        assert response.status_code==401
        assert response.json()["detail"]=="Invalid email or password"


    def test_login_unknown_email(self,client):
        response=client.post(
            "/auth/login",
            json={
                "email":"doesnotexist@example.com",
                "password":"TestPassword@123"
            }
        )

        assert response.status_code==401
        assert response.json()["detail"]=="Invalid email or password"


    def test_auth_me(self,client):
        email="metest_unique@example.com"
        password="MePassword@123"

        register_response=client.post(
            "/auth/register",
            json={
                "name":"Me Test User",
                "email":email,
                "password":password,
                "role":"victim"
            }
        )

        assert register_response.status_code==200

        user_id=register_response.json()["user_id"]

        login_response=client.post(
            "/auth/login",
            json={
                "email":email,
                "password":password
            }
        )

        assert login_response.status_code==200

        token=login_response.json()["access_token"]

        response=client.get(
            "/auth/me",
            headers={
                "Authorization":f"Bearer {token}"
            }
        )

        assert response.status_code==200

        data=response.json()

        assert data["message"]=="You are authenticated"
        assert data["user"]["user_id"]==user_id
        assert data["user"]["role"]=="victim"


    def test_auth_me_without_token(self,client):
        response=client.get("/auth/me")

        assert response.status_code==401


    def test_role_specific_login_victim(self, client):
        email = "victim_login_test@example.com"
        password = "TestPassword@123"

        reg = client.post(
            "/auth/register",
            json={"name": "Victim User", "email": email, "password": password, "role": "victim"}
        )
        assert reg.status_code == 200

        # Login through victim endpoint
        res = client.post("/auth/login/victim", json={"email": email, "password": password})
        assert res.status_code == 200
        assert res.json()["role"] == "victim"


    def test_role_specific_login_volunteer(self, client):
        email = "volunteer_reg_test@example.com"
        password = "TestPassword@123"

        reg = client.post(
            "/auth/register/volunteer",
            json={
                "name": "Volunteer User",
                "email": email,
                "password": password,
                "skills": "Medical & Rescue"
            }
        )
        assert reg.status_code == 200
        assert reg.json()["role"] == "volunteer"

        # Login through volunteer endpoint
        res = client.post("/auth/login/volunteer", json={"email": email, "password": password})
        assert res.status_code == 200
        assert res.json()["role"] == "volunteer"


    def test_role_specific_login_wrong_role_rejected(self, client):
        email = "victim_cross_role@example.com"
        password = "TestPassword@123"

        client.post(
            "/auth/register",
            json={"name": "Victim Only", "email": email, "password": password, "role": "victim"}
        )

        # Attempt to log in through admin portal with victim account
        res = client.post("/auth/login/admin", json={"email": email, "password": password})
        assert res.status_code == 403
        assert "Access denied" in res.json()["detail"]

        # Attempt to log in through volunteer portal with victim account
        res_vol = client.post("/auth/login/volunteer", json={"email": email, "password": password})
        assert res_vol.status_code == 403
        assert "Access denied" in res_vol.json()["detail"]


    def test_public_admin_registration_rejected(self, client):
        res = client.post(
            "/auth/register",
            json={
                "name": "Malicious Admin",
                "email": "hacker_admin@example.com",
                "password": "TestPassword@123",
                "role": "admin"
            }
        )
        assert res.status_code == 400
        assert "Public administrator registration is not permitted" in res.json()["detail"]