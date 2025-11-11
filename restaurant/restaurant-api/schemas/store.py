from decimal import Decimal
from pydantic import BaseModel, BeforeValidator, ConfigDict
from typing import List, Optional, Annotated

from schemas.comment import CommentRead

# --- (신규) 검증 함수 ---
def empty_str_to_none(value: any) -> Optional[any]:
    """
    입력 값이 빈 문자열("")이면 None을 반환하고,
    그렇지 않으면 원래 값을 반환합니다.
    """
    if value == "":
        return None
    return value

# --- StoreItem 스키마 수정 ---
class StoreItem(BaseModel):
    """
    API 응답의 'items' 배열 내 개별 상점 스키마
    """
    bizesId: str
    bizesNm: str
    brchNm: Optional[str] = None
    indsLclsCd: str
    indsLclsNm: str
    indsMclsCd: str
    indsMclsNm: str
    indsSclsCd: str
    indsSclsNm: str
    ksicCd: Optional[str] = None
    ksicNm: Optional[str] = None
    ctprvnCd: Optional[str] = None
    ctprvnNm: Optional[str] = None
    signguCd: Optional[str] = None
    signguNm: Optional[str] = None
    adongCd: Optional[str] = None
    adongNm: Optional[str] = None
    ldongCd: Optional[str] = None
    ldongNm: Optional[str] = None
    lnoCd: Optional[str] = None
    plotSctCd: Optional[str] = None
    plotSctNm: Optional[str] = None
    
    # [수정] 빈 문자열("")을 None으로 처리하도록 Annotated 및 BeforeValidator 적용
    lnoMnno: Annotated[Optional[int], BeforeValidator(empty_str_to_none)] = None
    lnoSlno: Annotated[Optional[int], BeforeValidator(empty_str_to_none)] = None
    
    lnoAdr: Optional[str] = None
    rdnmCd: Optional[str] = None
    rdnm: Optional[str] = None
    
    # [수정] 빈 문자열("")을 None으로 처리하도록 Annotated 및 BeforeValidator 적용
    bldMnno: Annotated[Optional[int], BeforeValidator(empty_str_to_none)] = None
    
    bldSlno: Annotated[Optional[int], BeforeValidator(empty_str_to_none)] = None
    bldMngNo: Optional[str] = None
    bldNm: Optional[str] = None
    rdnmAdr: Optional[str] = None
    oldZipcd: Optional[str] = None
    newZipcd: Optional[str] = None
    dongNo: Optional[str] = None
    flrNo: Optional[str] = None
    hoNo: Optional[str] = None
    
    # [수정] 좌표 필드에도 동일하게 적용
    lon: Annotated[Optional[Decimal], BeforeValidator(empty_str_to_none)] = None
    lat: Annotated[Optional[Decimal], BeforeValidator(empty_str_to_none)] = None

    class Config:
        from_attributes = True


class ResponseBody(BaseModel):
    items: List[StoreItem]

class ApiResponse(BaseModel):
    header: dict
    body: ResponseBody


class StoreReadForVue(BaseModel):
    id: str
    name: str
    category: str
    address: Optional[str]
    coords: List[Decimal]
    comments: List[CommentRead] = []  # 항상 CommentRead 리스트

    model_config = ConfigDict(from_attributes=True)