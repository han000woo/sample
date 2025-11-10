from sqlalchemy.orm import Session, joinedload
from typing import List

from models.store import Store
from models.comment import Comment
from models.favorite import Favorite
from schemas.store import StoreReadForVue
from service.utils import convert_stores_to_vue_schema # [신규] 유틸리티 임포트

def get_user_favorite_stores(db: Session, user_id: int) -> List[StoreReadForVue]:
    """
    특정 사용자가 즐겨찾기한 모든 상점 목록을 반환합니다.
    (Eager Loading 최적화 포함)
    """
    # 1. Store와 Favorite를 조인하고, user_id로 필터링
    # 2. Store에 연결된 comments와 owner도 Eager Loading
    stores = (
        db.query(Store)
        .join(Favorite)
        .filter(Favorite.user_id == user_id)
        .options(
            joinedload(Store.comments).joinedload(Comment.owner)
        )
        .all()
    )
    
    # 3. Vue 스키마로 변환하여 반환
    return convert_stores_to_vue_schema(stores)

def add_favorite(db: Session, user_id: int, store_id: str) -> Favorite:
    """
    즐겨찾기를 추가합니다. (이미 존재하면 아무것도 안 함)
    """
    # 이미 존재하는지 확인
    db_favorite = db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.store_id == store_id
    ).first()
    
    if db_favorite:
        return db_favorite # 이미 존재하면 그냥 반환
    
    # 새로 생성
    new_favorite = Favorite(user_id=user_id, store_id=store_id)
    db.add(new_favorite)
    db.commit()
    db.refresh(new_favorite)
    return new_favorite

def remove_favorite(db: Session, user_id: int, store_id: str):
    """
    즐겨찾기를 삭제합니다.
    """
    db_favorite = db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.store_id == store_id
    ).first()
    
    if db_favorite:
        db.delete(db_favorite)
        db.commit()
    return True # 성공 여부 반환 (간단히)

def check_if_favorite(db: Session, user_id: int, store_id: str) -> bool:
    """
    현재 사용자가 해당 상점을 즐겨찾기 했는지 확인합니다.
    """
    return db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.store_id == store_id
    ).count() > 0