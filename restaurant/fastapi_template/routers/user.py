from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.database import get_db
import schemas.user as user_schema
import service.user as user_service


router = APIRouter(
    prefix="/users",
    tags=["Users"] # API 문서 그룹화 
)

@router.post("/", response_model=user_schema.UserRead, status_code=status.HTTP_201_CREATED)
def create_user_endpoint(user: user_schema.UserCreate, db: Session = Depends(get_db)):
    """
    새로운 사용자를 생성합니다.
    """
    # [수정] email이 아닌 username으로 사용자를 검사해야 합니다.
    # db_user = user_service.get_user_by_email(db, email=user.email) 
    db_user = user_service.get_user_by_username(db, username=user.username) 
    
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            # [수정] 에러 메시지 변경
            detail="이미 등록된 아이디입니다." 
        )

    # user_service에 create_user 함수가 구현되어 있어야 합니다.
    # (auth.utils.get_password_hash를 사용하여 비밀번호를 해싱해야 함)
    return user_service.create_user(db=db, user=user)

@router.get("/", response_model=List[user_schema.UserRead])
def read_users_endpoint(skip: int = 0, limit: int = 100, db : Session = Depends(get_db)) :
    """
    사용자 목록을 조회합니다.
    - **skip**: 건너뛸 항목 수 (페이지네이션)
    - **limit**: 반환할 최대 항목 수 (페이지네이션)
    - (Controller -> crud.get_users)
    """
    users = user_service.get_users(db, skip=skip, limit=limit)
    return users 

@router.get("/{user_id}",response_model=user_schema.UserRead)
def read_user_endpoint(user_id : int, db:Session = Depends(get_db)) :
    """
    특정 ID의 사용자를 조회합니다.
    - **user_id**: 조회할 사용자의 ID
    - (Controller -> crud.get_user)
    """
    db_user = user_service.get_user(db, user_id=user_id)
    if db_user is None : 
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다."
        )
    return db_user