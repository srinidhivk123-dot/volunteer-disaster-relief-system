from app.core.security import hash_password
from app.core.security import verify_password
from app.core.security import create_access_token
from app.core.security import verify_token


class TestSecurity:

    def test_hash_password(self):
        password="TestPassword@123"

        hashed_password=hash_password(password)

        assert hashed_password!=password
        assert len(hashed_password)>0


    def test_verify_password_correct(self):
        password="TestPassword@123"

        hashed_password=hash_password(password)

        assert verify_password(
            password,
            hashed_password
        ) is True


    def test_verify_password_incorrect(self):
        password="TestPassword@123"

        hashed_password=hash_password(password)

        assert verify_password(
            "WrongPassword@123",
            hashed_password
        ) is False


    def test_create_and_verify_access_token(self):
        data={
            "user_id":5,
            "role":"victim"
        }

        token=create_access_token(data)

        payload=verify_token(token)

        assert payload is not None
        assert payload["user_id"]==5
        assert payload["role"]=="victim"
        assert "exp" in payload


    def test_verify_invalid_token(self):
        result=verify_token("invalid.token.value")

        assert result is None

    def test_production_secret_key_enforced(self, monkeypatch):
        import importlib
        import app.core.security as sec
        orig_secret = sec.SECRET_KEY
        orig_env = sec.ENVIRONMENT

        monkeypatch.setenv("ENVIRONMENT", "production")
        monkeypatch.setenv("SECRET_KEY", "")

        import pytest
        try:
            # 1. Test empty secret in production
            with pytest.raises(RuntimeError) as exc_info:
                importlib.reload(sec)
            assert "CRITICAL SECURITY CONFIGURATION ERROR" in str(exc_info.value)

            # 2. Test weak short secret in production
            monkeypatch.setenv("SECRET_KEY", "too-short")
            with pytest.raises(RuntimeError) as exc_info2:
                importlib.reload(sec)
            assert "too short" in str(exc_info2.value)

            # 3. Test strong secret in production succeeds
            monkeypatch.setenv("SECRET_KEY", "a" * 32)
            importlib.reload(sec)
            assert sec.SECRET_KEY == "a" * 32
        finally:
            monkeypatch.setenv("ENVIRONMENT", orig_env)
            monkeypatch.setenv("SECRET_KEY", orig_secret)
            importlib.reload(sec)