# from sqlalchemy import create_engine
# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm import sessionmaker

# SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

# engine = create_engine(
#     SQLALCHEMY_DATABASE_URL,
#     connect_args={"check_same_thread":False}
# )

# SessionLocal = sessionmaker(autocommit=False, autoflush= False, bind=engine)

# Base = declarative_base()

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:root@mysql_db:3306/sample_db"  # mysql_db는 docker-compose 서비스 이름
)
engine = create_engine(DATABASE_URL, echo=True, future=True)

# DB 세션 생성을 위한 SessionLocal 클래스
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# DB 모델(models.py)들이 상속받을 Base 클래스
Base = declarative_base()

# --- 의존성 주입 (Dependency Injection) ---
def get_db():
    """
    API 요청마다 데이터베이스 세션을 생성하고,
    요청이 완료되면 세션을 닫는 의존성 함수.
    컨트롤러(라우터)에서 이 함수를 사용하여 세션을 주입받습니다.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()