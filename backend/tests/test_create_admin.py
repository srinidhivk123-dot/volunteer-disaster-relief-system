import pytest
from app.models.user import User
from app.core.security import verify_password
from scripts.create_admin import validate_password_strength, create_or_promote_admin


def test_password_strength_validation():
    # Too short
    with pytest.raises(ValueError, match="at least 8 characters"):
        validate_password_strength("Short1A")

    # Missing uppercase
    with pytest.raises(ValueError, match="at least one uppercase"):
        validate_password_strength("lowercase123")

    # Missing lowercase
    with pytest.raises(ValueError, match="at least one lowercase"):
        validate_password_strength("UPPERCASE123")

    # Missing digit
    with pytest.raises(ValueError, match="at least one digit"):
        validate_password_strength("NoDigitsHere@")

    # Valid
    validate_password_strength("ValidPassword@123")


def test_create_new_admin_in_db(db, monkeypatch):
    monkeypatch.setattr("scripts.create_admin.SessionLocal", lambda: db)

    email = "new_test_admin@example.com"
    name = "Field Officer"
    password = "StrongPassword@123"

    ret = create_or_promote_admin(email=email, name=name, password=password)
    assert ret == 0

    user = db.query(User).filter(User.email == email).first()
    assert user is not None
    assert user.role == "admin"
    assert user.name == name
    assert verify_password(password, user.password_hash) is True


def test_promote_existing_user_to_admin(db, monkeypatch):
    monkeypatch.setattr("scripts.create_admin.SessionLocal", lambda: db)

    # First create a victim
    victim = User(
        name="Regular Victim",
        email="promote_me@example.com",
        password_hash="old_hash",
        role="victim"
    )
    db.add(victim)
    db.commit()
    db.refresh(victim)

    new_password = "UpgradedPassword@123"
    ret = create_or_promote_admin(
        email="promote_me@example.com",
        name="Promoted Officer",
        password=new_password
    )
    assert ret == 0

    user = db.query(User).filter(User.email == "promote_me@example.com").first()
    assert user.role == "admin"
    assert user.name == "Promoted Officer"
    assert verify_password(new_password, user.password_hash) is True
