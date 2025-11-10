from sqlalchemy import Column, String, Float, DECIMAL
from sqlalchemy.orm import relationship
from database.database import Base

class Store(Base):
    __tablename__ = "stores"

    # Primary Key
    bizesId = Column(String(50), primary_key=True, index=True) 
    
    # 상호명
    bizesNm = Column(String(100), index=True)
    brchNm = Column(String(50), nullable=True) # 지점명
    
    # 업종 분류
    indsLclsNm = Column(String(50)) # 대분류
    indsMclsNm = Column(String(50)) # 중분류
    indsSclsNm = Column(String(50)) # 소분류
    
    # 주소
    rdnmAdr = Column(String(200), nullable=True) # 도로명주소
    lnoAdr = Column(String(200), nullable=True) # 지번주소
    
    # 좌표
    
    lon = Column(DECIMAL(11, 8), nullable=True)  # 경도, 소수점 8자리
    lat = Column(DECIMAL(11, 8), nullable=True)  # 위도, 소수점 8자리

    # 관계
    comments = relationship(
        "Comment", 
        back_populates="store", 
        cascade="all, delete-orphan"
    )

    favorited_by = relationship(
        "Favorite",
        back_populates="store",
        cascade="all, delete-orphan"
    )
