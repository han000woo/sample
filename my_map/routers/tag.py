from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import crud
from database import get_db
import schemas

router = APIRouter(
    prefix="/tags",
    tags=["Tags"] 
)

@router.post("/",response_model=schemas.TagRead, status_code=status.HTTP_201_CREATED)
def create_tag_endpoint(tag: schemas.TagCreate, db: Session = Depends(get_db)) :
    """
    새로운 태그를 생성합니다. (중복 이름 방지)
    - **tag**: 태그 이름을 포함하는 TagCreate 스키마.
    - (Controller -> crud.get_tag_by_name, crud.create_tag)
    """
    return crud.create_tag(db=db, tag=tag)

@router.get("/",response_model=List[schemas.TagRead])
def read_tags_endpoint(skip: int = 0, limit: int = 100, db:Session = Depends(get_db)) :
    """
    태그 목록을 조회합니다.
    - **skip**: 건너뛸 항목 수 (페이지네이션)
    - **limit**: 반환할 최대 항목 수 (페이지네이션)
    - (Controller -> crud.get_tags)
    """
    tags= crud.get_tags(db, skip=skip, limit=limit)
    return tags 

@router.get("/{tag_id}", response_model=schemas.TagRead) 
def read_tag_endpoint(tag_id: int, db:Session =Depends(get_db)):
    """
    특정 ID의 태그를 조회합니다.
    - **tag_id**: 조회할 태그의 ID
    - (Controller -> crud.get_tag_by_id)
    """
    db_tag = crud.get_tag_by_id(db, tag_id=tag_id)
    if db_tag is None : 
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="태그를 찾을 수 없습니다."
        )
    return db_tag