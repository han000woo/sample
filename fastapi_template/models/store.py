from sqlalchemy import Column
from database.database import Base
from sqlalchemy import Column, String, Float
from sqlalchemy.orm import relationship

class Store(Base):
    """
    소상공인 상가 정보를 저장하는 SQLAlchemy 모델
    """
    __tablename__ = "stores"

    # Primary Key
    bizesId = Column(String, primary_key=True, index=True) 
    
    # 상호명
    bizesNm = Column(String, index=True)
    brchNm = Column(String, nullable=True) # 지점명
    
    # 업종 분류
    indsLclsNm = Column(String) # 대분류
    indsMclsNm = Column(String) # 중분류
    indsSclsNm = Column(String) # 소분류
    
    # 주소
    rdnmAdr = Column(String, nullable=True) # 도로명주소
    lnoAdr = Column(String, nullable=True) # 지번주소
    
    # 좌표
    lon = Column(Float, nullable=True) # 경도
    lat = Column(Float, nullable=True) # 위도

    # [신규] Store가 삭제되면 관련 댓글도 삭제 (1:N 관계)
    comments = relationship(
        "Comment", 
        back_populates="store", 
        cascade="all, delete-orphan"
    )