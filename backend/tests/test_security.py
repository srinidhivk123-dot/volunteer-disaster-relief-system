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