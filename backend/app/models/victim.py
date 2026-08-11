from sqlalchemy import Column, Integer, String, ForeignKey
from app.core.database import Base


class Victim(Base):
    __tablename__ = "victims"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    contact_number = Column(String(20), nullable=True)
    address = Column(String(200), nullable=True)