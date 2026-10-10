from sqlalchemy import Column,Integer,String,Text,ForeignKey,Float
from app.core.database import Base


class ReliefRequest(Base):
    __tablename__="relief_requests"

    id=Column(Integer,primary_key=True,index=True)
    victim_id=Column(Integer,ForeignKey("users.id"),nullable=True)
    disaster_id=Column(Integer,ForeignKey("disasters.id"),nullable=False)
    request_type=Column(String(100),nullable=False)
    description=Column(Text,nullable=False)
    location=Column(String(150),nullable=False)
    priority=Column(String(20),nullable=False,default="MEDIUM")
    request_source=Column(String(30),nullable=False,default="victim")
    status=Column(String(30),nullable=False,default="pending")
    phone=Column(String(15),nullable=True)
    latitude=Column(Float,nullable=True)
    longitude=Column(Float,nullable=True)