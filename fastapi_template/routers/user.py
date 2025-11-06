from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import crud,schemas.schemas as schemas


router = APIRouter(
    prefix="/users",
    tags=["Users"] # API 문서 그룹화 
)

@router.post("/", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
def create_user_endpoint(user: schemas.UserCreate, db: Session =Depends(get_db)) :
    """
    새로운 사용자를 생성합니다.
    - **user**: 사용자 이름, 이메일, 비밀번호를 포함하는 UserCreate 스키마.
    - (Controller -> crud.create_user)
    """
    db_user = crud.get_user_by_email(db, email=user.email) 
    if db_user :
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 등록된 이메일입니다."
        )

    return crud.create_user(db=db, user=user)

@router.get("/", response_model=List[schemas.UserRead])
def read_users_endpoint(skip: int = 0, limit: int = 100, db : Session = Depends(get_db)) :
    """
    사용자 목록을 조회합니다.
    - **skip**: 건너뛸 항목 수 (페이지네이션)
    - **limit**: 반환할 최대 항목 수 (페이지네이션)
    - (Controller -> crud.get_users)
    """
    users = crud.get_users(db, skip=skip, limit=limit)
    return users 

@router.get("/{user_id}",response_model=schemas.UserRead)
def read_user_endpoint(user_id : int, db:Session = Depends(get_db)) :
    """
    특정 ID의 사용자를 조회합니다.
    - **user_id**: 조회할 사용자의 ID
    - (Controller -> crud.get_user)
    """
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None : 
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다."
        )
    return db_user