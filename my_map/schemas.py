from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# --- 태그(Tag) 스키마 ---
class TagBase(BaseModel):
    name: str


class TagCreate(TagBase):
    pass


class TagRead(TagBase):
    id: int

    # SQLAlchemy 모델 객체로부터 Pydantic 모델을 생성할 수 있도록 함
    model_config = ConfigDict(from_attributes=True)


# --- 댓글(Comment) 스키마 ---
class CommentBase(BaseModel):
    text: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class CommentCreate(CommentBase):
    pass


class CommentRead(CommentBase):
    id: int
    created_at: datetime
    owner_id: int
    tags: List[TagRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

class CommentUpdate(CommentBase):
    id: int
    owner_id: int
    tags: Optional[List[int]] = Field(default_factory=list)



# --- 사용자(User) 스키마 ---
class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


# 사용자 조회 시 보여줄 스키마 (비밀번호 제외, 댓글 목록 포함)
class UserRead(UserBase):
    id: int
    is_active: bool
    comments: List[CommentRead] = []  # 사용자가 작성한 댓글 목록

    model_config = ConfigDict(from_attributes=True)


# Pydantic이 순환 참조(UserRead -> CommentRead, CommentRead -> TagRead)를
# 올바르게 처리할 수 있도록 forward reference를 업데이트합니다.
# (최신 Pydantic에서는 자동으로 잘 처리되는 경우가 많지만 명시적으로 추가)
UserRead.model_rebuild()
CommentRead.model_rebuild()
