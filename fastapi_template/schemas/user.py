from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# --- 사용자(User) 스키마 ---
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserInDB(UserBase) :
    hashed_password: str 

class UserCreate(UserBase):
    password: str