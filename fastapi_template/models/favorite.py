from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database.database import Base

class Favorite(Base):
    """
    사용자(User)와 상점(Store) 간의 즐겨찾기(N:M) 연결 모델
    """
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    
    # User(N) -> Favorite(1)
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="favorites")

    # Store(N) -> Favorite(1)
    store_id = Column(String(20), ForeignKey("stores.bizesId"))  # 길이 지정 필요
    store = relationship("Store", back_populates="favorited_by")
