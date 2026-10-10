from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
import os

load_dotenv()

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
IS_RENDER = os.getenv("RENDER", "").lower() == "true"
IS_PRODUCTION = ENVIRONMENT in ("production", "prod") or IS_RENDER

INSECURE_DEFAULT_SECRET = "relief-connect-default-secret-key-change-in-production"
SECRET_KEY = os.getenv("SECRET_KEY")

if IS_PRODUCTION:
    if not SECRET_KEY or SECRET_KEY == INSECURE_DEFAULT_SECRET or len(SECRET_KEY) < 32:
        raise RuntimeError(
            "CRITICAL SECURITY CONFIGURATION ERROR: SECRET_KEY environment variable is not configured or is too short (min 32 characters) for production. "
            "Production deployments must provide a strong, high-entropy secret key. "
            "Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
        )
else:
    if not SECRET_KEY:
        SECRET_KEY = INSECURE_DEFAULT_SECRET

ALGORITHM = os.getenv("ALGORITHM", "HS256")
try:
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
except (ValueError, TypeError):
    ACCESS_TOKEN_EXPIRE_MINUTES = 60



pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password):
    return pwd_context.hash(password)


def verify_password(password,hashed_password):
    try:
        return pwd_context.verify(password,hashed_password)
    except Exception:
        return False


def create_access_token(data):
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def verify_token(token):
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        return payload
    except Exception:
        return None