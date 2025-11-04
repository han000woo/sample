from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

comment_tags = Table(
    'comment_tags',
    Base.metadata,
    Column('comment_id', Integer, ForeignKey('comments.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id'), primary_key=True)
)

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
    text = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    latitude = Column(Float,nullable=True, index=True)
    longitude = Column(Float, nullable=True, index=True)
    
    # User(owner)와의 관계 (외래 키)
    owner_id = Column(Integer,ForeignKey("users.id"))

    # 'owner' 속성을 통해 이 댓글의 작성자에 접근 가능
    owner = relationship("User", back_populates="comments")

    # Tag와의 다대다(Many-to-Many) 관계
    # 'tags' 속성을 통해 이 댓글에 달린 모든 태그에 접근 가능
    tags = relationship(
        "Tag",
        secondary=comment_tags, 
        back_populates="comments"
    )
    
# --- 태그(Tag) 모델 ---
class Tag(Base) :
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

    # Comment와의 다대다(Many-to-Many) 관계
    # 'comments' 속성을 통해 이 태그가 달린 모든 댓글에 접근 가능
    comments = relationship(
        "Comment" ,
        secondary=comment_tags,
        back_populates="tags"
    )