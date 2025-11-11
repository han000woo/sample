from sqlalchemy.orm import Session, joinedload
from typing import List

from models.store import Store
from models.comment import Comment # [신규] Comment 모델 임포트 (joinedload용)
from schemas.store import StoreReadForVue
from schemas.comment import CommentRead 

# [신규] 변환 로직을 담은 유틸리티 임포트
from service.utils import convert_stores_to_vue_schema

def get_all_stores(db: Session, skip: int = 0, limit: int = 1000) -> List[StoreReadForVue]:
    """
    DB에서 Store 목록을 조회하여 Vue 클라이언트용 스키마로 변환합니다.
    (N+1 문제 방지를 위해 comments와 owner를 Eager Loading 합니다)
    """
    
    # 1. DB 조회 (Eager Loading 최적화)
    db_stores = (
        db.query(Store)
        .options(
            # Store.comments 관계를 로드하고,
            # 이어서 Comment.owner 관계를 로드합니다.
            joinedload(Store.comments).joinedload(Comment.owner)
        )
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    # 2. Vue용 Pydantic 스키마 리스트로 변환 (유틸리티 함수 사용)
    return convert_stores_to_vue_schema(db_stores)