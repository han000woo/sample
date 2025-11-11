from typing import List
from models.store import Store
from schemas.comment import CommentRead
from schemas.store import StoreReadForVue


def convert_store_to_vue_schema(store: Store) -> StoreReadForVue:
    """
    SQLAlchemy Store 모델 객체 하나를 Vue용 Pydantic 스키마로 변환합니다.
    (Eager Loading이 완료되었다고 가정)
    """
    lon = store.lon or 0.0
    lat = store.lat or 0.0

    comments_for_vue = [
        CommentRead(
            id=c.id,
            author=c.owner.username, # Eager Loading됨
            rating=c.rating,
            text=c.text
        ) for c in store.comments
    ]

    return StoreReadForVue(
        id=store.bizesId,
        name=store.bizesNm,
        category=store.indsSclsNm or "기타",
        address=store.rdnmAdr or store.lnoAdr or "주소 정보 없음",
        coords=[lon, lat],
        comments=comments_for_vue
    )

def convert_stores_to_vue_schema(stores: List[Store]) -> List[StoreReadForVue]:
    """
    Store 모델 리스트를 Vue용 Pydantic 스키마 리스트로 변환합니다.
    """
    return [convert_store_to_vue_schema(store) for store in stores]