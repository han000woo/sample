from sqlalchemy.orm import Session, joinedload
from typing import List

from models.store import Store
from models.comment import Comment # [신규] Comment 모델 임포트
from schemas.store import StoreReadForVue # [수정] StoreReadForVue만 가져옴
from schemas.comment import CommentRead  # [수정] CommentRead는 여기서 가져옴

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
            # [수정] 이어서 Comment의 "owner" 속성을 클래스 기반으로 로드합니다.
            joinedload(Store.comments).joinedload(Comment.owner)
        )
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    # 2. Vue용 Pydantic 스키마 리스트로 변환
    results = []
    for store in db_stores:
        # store.lon이 None일 경우를 대비 (store.lon or 0.0)
        lon = store.lon or 0.0
        lat = store.lat or 0.0

        # 이제 store.comments와 c.owner는 DB 쿼리를 발생시키지 않습니다.
        comments_for_vue = [
            CommentRead(
                id=c.id,
                author=c.owner.username, # Eager Loading 덕분에 DB 히트 없음
                rating=c.rating,
                text=c.text
            ) for c in store.comments # store.comments는 이제 로드된 상태
        ]

        results.append(StoreReadForVue(
            id=store.bizesId,
            name=store.bizesNm,
            category=store.indsSclsNm or "기타",
            address=store.rdnmAdr or store.lnoAdr or "주소 정보 없음",
            coords=[lon, lat],
            comments=comments_for_vue
        ))
        
    return results