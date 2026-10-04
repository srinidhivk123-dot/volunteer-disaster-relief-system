import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.core.database import Base
from app.main import app
from app.api.auth import get_db

TEST_DATABASE_URL="sqlite://"

test_engine=create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread":False},
    poolclass=StaticPool
)

TestingSessionLocal=sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine
)

from app import models


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=test_engine)

    db=TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db]=override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()