from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


# --- 사용자(User) 모델 ---
class User(Base) :
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    # User와 Comment 간의 일대다(One-to-Many) 관계
    # 'comments' 속성을 통해 이 사용자가 작성한 모든 댓글에 접근 가능
    comments = relationship("Comment", back_populates="owner")

# --- 댓글(Comment) 모델 ---
class Comment(Base) :
    __tablename__= "comments"

    id =Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    text = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    latitude = Column(Float,nullable=True, index=True)
    longitude = Column(Float, nullable=True, index=True)
    
    # User(owner)와의 관계 (외래 키)
    owner_id = Column(Integer,ForeignKey("users.id"))

    # 'owner' 속성을 통해 이 댓글의 작성자에 접근 가능
    owner = relationship("User", back_populates="comments")

    tags = Column(JSON, nullable=True, default=[])

# --- 태그(Tag) 모델 ---
class Tag(Base) :
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

    # Comment와의 다대다(Many-to-Many) 관계
    # 'comments' 속성을 통해 이 태그가 달린 모든 댓글에 접근 가능