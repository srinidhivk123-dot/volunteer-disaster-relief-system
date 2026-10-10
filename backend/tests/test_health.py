from fastapi.testclient import TestClient

from app.main import app


class TestHealth:

    def test_health(self):
        client = TestClient(app)
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "OK"}

    def test_cors_headers_present(self):
        client = TestClient(app)
        origin = "https://volunteer-disaster-relief-system-fr-xi.vercel.app"
        response = client.get("/health", headers={"Origin": origin})
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == origin

    def test_global_exception_handler_sanitizes_errors(self):
        from fastapi import APIRouter
        test_router = APIRouter()

        @test_router.get("/test-internal-error")
        def throw_error():
            raise Exception("Sensitive DB credentials host=secret-db.internal:3306")

        app.include_router(test_router)
        client = TestClient(app, raise_server_exceptions=False)
        origin = "https://volunteer-disaster-relief-system-fr-xi.vercel.app"

        response = client.get("/test-internal-error", headers={"Origin": origin})
        assert response.status_code == 500
        # Verify internal details/credentials/stack trace NOT exposed to client
        assert "secret-db" not in response.text
        assert "Sensitive DB" not in response.text
        assert response.json() == {
            "detail": "An internal server error occurred. Please try again later or contact the administrator."
        }
        # Verify CORS headers still present on 500
        assert response.headers.get("access-control-allow-origin") == origin