from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

# --- [필수] create_comment_for_store에 필요한 모든 의존성 ---
from database.database import get_db
import schemas.comment as comment_schema
import service.comment as comment_service
from auth.utils import get_current_active_user
from schemas.user import UserRead
# ---

router = APIRouter(
    prefix="/comment", # [수정] store 라우터와 prefix를 맞춥니다.
    tags=["Comments"] # API 문서 그룹화를 위해 태그는 "Comments"로 변경
)

@router.post("/{store_id}", response_model=comment_schema.CommentRead)
def create_comment_for_store(
    store_id: str,
    comment: comment_schema.CommentCreate,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(get_current_active_user)
):
    """
    특정 상점(store_id)에 대한 새 댓글을 생성합니다.
    """
    return comment_service.create_comment(
        db=db,
        comment=comment,
        store_id=store_id,
        user_id=current_user.id
    )
