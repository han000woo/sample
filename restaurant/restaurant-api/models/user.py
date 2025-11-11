from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.database import Base


# --- 사용자(User) 모델 ---
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    is_active = Column(Boolean, default=True)

    comments = relationship("Comment", back_populates="owner")
    favorites = relationship(
        "Favorite", back_populates="user", cascade="all, delete-orphan"
    )
