from typing import List
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status 
from auth.utils import get_current_user
import crud
from database import get_db
import schemas
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

router = APIRouter(
    prefix="/comments",
    tags=["Comments"] 
)

@router.get("/", response_model= List[schemas.CommentRead])
def read_comments_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    전체 댓글 목록을 조회합니다.
    - **skip**: 건너뛸 항목 수 (페이지네이션)
    - **limit**: 반환할 최대 항목 수 (페이지네이션)
    - (Controller -> crud.get_comments)
    """
    comments = crud.get_comments(db, skip=skip, limit=limit) 
    return comments

@router.get("/{comment_id}",response_model=schemas.CommentRead) 
def read_comment_endpoint(comment_id: int, db: Session = Depends(get_db)):
    """
    특정 ID의 댓글을 조회합니다.
    - **comment_id**: 조회할 댓글의 ID
    - (Controller -> crud.get_comment_by_id)
    """
    db_comment = crud.get_comment_by_id(db, comment_id=comment_id)
    if db_comment is None : 
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="댓글을 찾을 수 없습니다."
        )
    return db_comment 

@router.post("/", response_model=schemas.CommentRead, status_code=status.HTTP_201_CREATED)
def create_comment_for_user_endpoint(
    comment: schemas.CommentCreate, 
    db:Session =Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """
    특정 사용자의 새 댓글을 생성합니다.
    - **comment**: 댓글 내용을 포함하는 CommentCreate 스키마.
    - (Controller -> crud.create_user_comment)
    """
    # 사용자가 존재하는지 먼저 확인 (예시)
    db_user = get_current_user(token,db)
    
    return crud.create_user_comment(db=db, comment=comment, user_id=db_user.id)

@router.post("/{comment_id}/tags/{tag_id}", response_model=schemas.CommentRead)
def add_tag_to_comment_endpoint(
    comment_id : int, tag_id : int, db : Session =Depends(get_db)
) :
    """
    기존 댓글에 태그를 추가합니다 (M-M 관계).
    - **comment_id**: 태그를 추가할 댓글의 ID
    - **tag_id**: 추가할 태그의 ID
    - (Controller -> crud.add_tag_to_comment)
    """
    db_comment = crud.add_tag_to_comment(db, comment_id=comment_id, tag_id=tag_id)
    if db_comment is None : 
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="댓글 또는 태그를 찾을 수 없습니다."
        )
    return db_comment

@router.patch("/",response_model=schemas.CommentRead)
def update_comment_endpoint(
    comment: schemas.CommentUpdate, 
    db:Session =Depends(get_db), 
    token: str = Depends(oauth2_scheme) 
):
    """
    특정 사용자의 댓글을 수정합니다.
    - **user_id**: 댓글을 수정할 사용자의 ID
    - **comment**: 댓글 내용을 포함하는 CommentCreate 스키마.
    - **comment_id**: 댓글 내용을 포함하는 CommentCreate 스키마.
    - (Controller -> crud.create_user_comment)
    """
    db_user = get_current_user(token,db)
    db_comment = crud.update_user_comment(db, comment, db_user.id)
    if db_comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,  # 또는 403, 상황에 따라 다름
            detail="댓글을 찾을 수 없거나 권한이 없습니다."
        )
    return db_comment

@router.delete("/{comment_id}", status_code=204, response_model=None)
def delete_comment_endpoint(
    comment_id: int, 
    db:Session =Depends(get_db),
    token: str = Depends(oauth2_scheme) 
):
    """
    특정 사용자의 댓글을 삭제합니다..
    - **user_id**: 댓글을 삭제할 사용자의 ID
    - **comment**: 삭제할 댓글을 나타내는 스키마
    - (Controller -> crud.delete_user_comment)
    """
    db_user = get_current_user(token,db)
    db_comment = crud.delete_user_comment(db,comment_id,db_user.id)
    if db_comment is None :
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="댓글을 찾을 수 없거나 권한이 없습니다."
        )
    return 
