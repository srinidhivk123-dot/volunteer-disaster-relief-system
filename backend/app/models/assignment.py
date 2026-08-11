from sqlalchemy import Column, Integer, String, ForeignKey
from app.core.database import Base


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    relief_request_id = Column(
        Integer,
        ForeignKey("relief_requests.id"),
        nullable=False
    )
    volunteer_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )
    status = Column(String(30), nullable=False, default="assigned")