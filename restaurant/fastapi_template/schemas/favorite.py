from pydantic import BaseModel

class FavoriteCreate(BaseModel):
    """
    즐겨찾기 추가 시 Body로 받을 스키마
    """
    store_id: str

class FavoriteCheck(BaseModel):
    """
    즐겨찾기 상태 조회 시 반환할 스키마
    """
    is_favorite: bool