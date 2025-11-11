from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db
from schemas.store import StoreReadForVue
from schemas.favorite import FavoriteCreate, FavoriteCheck
import service.favorite as favorite_service
from schemas.user import UserRead
from auth.utils import get_current_active_user

router = APIRouter(
    prefix="/favorites",
    tags=["Favorites"]
)

@router.get("/me", response_model=List[StoreReadForVue])
def get_my_favorites(
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(get_current_active_user)
):
    """
    현재 로그인한 사용자의 모든 즐겨찾기 상점 목록을 반환합니다.
    """
    return favorite_service.get_user_favorite_stores(db, user_id=current_user.id)

@router.post("/", status_code=status.HTTP_201_CREATED)
def add_new_favorite(
    favorite_data: FavoriteCreate,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(get_current_active_user)
):
    """
    현재 로그인한 사용자의 즐겨찾기에 새 상점을 추가합니다.
    """
    # store_id가 유효한지 간단히 확인 (선택 사항이나 권장)
    # ... (store_service.get_store_by_id(db, favorite_data.store_id) ...
    
    favorite_service.add_favorite(
        db, 
        user_id=current_user.id, 
        store_id=favorite_data.store_id
    )
    return {"message": "Favorite added successfully"}

@router.delete("/{store_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_existing_favorite(
    store_id: str,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(get_current_active_user)
):
    """
    현재 로그인한 사용자의 즐겨찾기에서 상점을 제거합니다.
    """
    favorite_service.remove_favorite(
        db, 
        user_id=current_user.id, 
        store_id=store_id
    )
    return 

@router.get("/check/{store_id}", response_model=FavoriteCheck)
def check_favorite_status(
    store_id: str,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(get_current_active_user)
):
    """
    현재 사용자가 특정 상점을 즐겨찾기 했는지 확인합니다.
    """
    is_favorite = favorite_service.check_if_favorite(
        db, 
        user_id=current_user.id, 
        store_id=store_id
    )
    return FavoriteCheck(is_favorite=is_favorite)