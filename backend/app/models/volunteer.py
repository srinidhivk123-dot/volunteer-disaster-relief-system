from sqlalchemy import Column, Integer, String, Text, ForeignKey
from app.core.database import Base


class Volunteer(Base):
    __tablename__ = "volunteers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skills = Column(Text, nullable=True)
    availability = Column(String(100), nullable=True)