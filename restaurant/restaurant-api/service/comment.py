from sqlalchemy.orm import Session
import models.comment as models
import schemas.comment as schemas
from sqlalchemy.orm import joinedload

def create_comment(
    db: Session,
    comment: schemas.CommentCreate,
    store_id: str,
    user_id: int
) -> schemas.CommentRead:
    # 1. DB 모델 생성
    db_comment = models.Comment(
        text=comment.text,
        rating=comment.rating,
        store_id=store_id,
        owner_id=user_id
    )

    # 2. DB 저장
    db.add(db_comment)
    db.commit()
    # owner를 Eager Load 하여 username 접근 안전하게
    db.refresh(db_comment)
    db.refresh(db_comment.owner)

    # 3. Pydantic 모델로 변환 후 반환
    return schemas.CommentRead(
        id=db_comment.id,
        author=db_comment.owner.username,
        rating=db_comment.rating,
        text=db_comment.text
    )
