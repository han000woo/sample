from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from database.database import Base # main database.py에서 Base를 가져옵니다.

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, nullable=False)
    rating = Column(Integer, nullable=False)

    # --- Foreign Keys (관계 설정) ---
    
    # 상점(Store)과의 관계 (N:1)
    # store.bizesId는 String이므로 String 타입 사용
    store_id = Column(String, ForeignKey("stores.bizesId")) 
    store = relationship("Store", back_populates="comments")

    # 작성자(User)와의 관계 (N:1)
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    # [수정] 관계 이름을 'owner'로 수정해야 합니다.
    owner = relationship("User", back_populates="comments")