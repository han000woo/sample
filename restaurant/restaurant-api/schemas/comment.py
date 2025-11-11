from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

# 댓글 생성용
class CommentBase(BaseModel):
    text: str
    rating: int = Field(..., ge=1, le=5)  # 1~5점

class CommentCreate(CommentBase):
    pass

# 클라이언트 반환용
class CommentRead(CommentBase):
    id: int
    author: str  # owner.username 매핑
    model_config = ConfigDict(from_attributes=True)
