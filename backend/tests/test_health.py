from fastapi.testclient import TestClient

from app.main import app


class TestHealth:

    def test_health(self):
        client=TestClient(app)

        response=client.get("/health")

        assert response.status_code==200
        assert response.json()=={"status":"OK"}