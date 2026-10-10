from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base,sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL=os.getenv("DATABASE_URL")

if not DATABASE_URL:
    DATABASE_URL="sqlite:///./test.db"

connect_args={}

if DATABASE_URL.startswith("sqlite"):
    connect_args={"check_same_thread":False}
elif DATABASE_URL.startswith("mysql+pymysql://"):
    ca_path=os.getenv("SSL_CA_PATH","/etc/secrets/ca.pem")
    if os.path.exists(ca_path):
        connect_args={
            "ssl":{
                "ca":ca_path
            }
        }

engine=create_engine(
    DATABASE_URL,
    connect_args=connect_args
)

SessionLocal=sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base=declarative_base()
