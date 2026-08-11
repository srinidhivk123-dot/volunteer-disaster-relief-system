from sqlalchemy import Column, Integer, String, Text
from app.core.database import Base


class Disaster(Base):
    __tablename__ = "disasters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    disaster_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(150), nullable=False)
    status = Column(String(30), nullable=False, default="active")