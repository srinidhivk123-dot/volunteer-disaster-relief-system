from sqlalchemy import Column,Integer,String,Text,ForeignKey,Float
from app.core.database import Base


class Volunteer(Base):
    __tablename__="volunteers"

    id=Column(Integer,primary_key=True,index=True)
    user_id=Column(Integer,ForeignKey("users.id"),nullable=False)
    skills=Column(Text,nullable=True)
    availability=Column(String(100),nullable=True)
    latitude=Column(Float,nullable=True)
    longitude=Column(Float,nullable=True)