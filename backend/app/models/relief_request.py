from sqlalchemy import Column, Integer, String, Text, ForeignKey
from app.core.database import Base


class ReliefRequest(Base):
    __tablename__ = "relief_requests"

    id = Column(Integer, primary_key=True, index=True)
    victim_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    disaster_id = Column(Integer, ForeignKey("disasters.id"), nullable=False)
    request_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(150), nullable=False)
    status = Column(String(30), nullable=False, default="pending")