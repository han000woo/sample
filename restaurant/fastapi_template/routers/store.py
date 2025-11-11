from fastapi import APIRouter, Depends, status 
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db
# [삭제] comment 관련 임포트 모두 제거


from schemas.store import StoreReadForVue
import service.store as store_service 

router = APIRouter(
    prefix="/stores", # [수정] prefix를 라우터 자체에 추가
    tags=["Stores"]
)

@router.get("/", response_model=List[StoreReadForVue]) # [수정] 경로 변경
def get_stores_list(
    skip: int = 0, 
    limit: int = 1000, 
    db: Session = Depends(get_db)
):
    """
    전체 상점 목록을 댓글, 작성자 정보와 함께 반환합니다.
    (Eager Loading 최적화 완료)
    """
    stores = store_service.get_all_stores(db, skip=skip, limit=limit)
    return stores

# ==========================================================
# --- [삭제] 댓글 생성 엔드포인트 ---
# --- 이 코드는 routers/comment.py로 이동했습니다 ---
# ==========================================================