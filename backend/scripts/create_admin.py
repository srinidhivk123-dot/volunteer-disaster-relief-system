"""
Secure Administrator Provisioning Script
Usage:
    python -m scripts.create_admin --email admin@domain.com --name "Command Officer"
    (prompts for password securely)
Or:
    python -m scripts.create_admin --email admin@domain.com --name "Command Officer" --password "YourSecurePassword@123"
"""
import argparse
import getpass
import sys
import logging
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("create_admin")


def validate_password_strength(password: str):
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if not any(char.isupper() for char in password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not any(char.islower() for char in password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not any(char.isdigit() for char in password):
        raise ValueError("Password must contain at least one digit")


def create_or_promote_admin(email: str, name: str, password: str | None = None):
    clean_email = email.strip().lower()
    clean_name = name.strip()

    with SessionLocal() as db:
        user = db.query(User).filter(User.email == clean_email).first()

        if user:
            logger.info("Existing user found for '%s'. Updating role to 'admin'...", clean_email)
            user.role = "admin"
            if clean_name:
                user.name = clean_name
            if password:
                validate_password_strength(password)
                user.password_hash = hash_password(password)
                logger.info("Password updated successfully.")
            db.commit()
            logger.info("✅ User '%s' is now an administrator (User ID: %d).", clean_email, user.id)
            return 0
        else:
            if not password:
                raise ValueError("Password is required when creating a new administrator account.")
            validate_password_strength(password)
            new_admin = User(
                name=clean_name,
                email=clean_email,
                password_hash=hash_password(password),
                role="admin"
            )
            db.add(new_admin)
            db.commit()
            db.refresh(new_admin)
            logger.info("✅ New administrator '%s' created successfully (User ID: %d).", clean_email, new_admin.id)
            return 0


def main():
    parser = argparse.ArgumentParser(description="Create or promote an administrator account.")
    parser.add_argument("--email", required=True, help="Administrator email address")
    parser.add_argument("--name", default="System Administrator", help="Administrator full name")
    parser.add_argument("--password", help="Administrator password (prompted if omitted)")

    args = parser.parse_args()

    pwd = args.password
    if not pwd:
        pwd = getpass.getpass("Enter administrator password: ")
        confirm_pwd = getpass.getpass("Confirm administrator password: ")
        if pwd != confirm_pwd:
            logger.error("Passwords do not match.")
            return 1

    try:
        return create_or_promote_admin(email=args.email, name=args.name, password=pwd)
    except Exception as e:
        logger.error("Failed to provision administrator: %s", e)
        return 1


if __name__ == "__main__":
    sys.exit(main())
