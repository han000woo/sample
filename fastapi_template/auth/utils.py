from datetime import datetime, timedelta, timezone
from typing import Annotated
from sqlalchemy.orm import Session
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError

from auth.hashing import verify_password
from auth.schemas import TokenData
from crud import get_user, get_user_by_username
from database import get_db
from schemas.schemas import UserRead

SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 
REFRESH_TOKEN_EXPIRE_DAYS = 7

## DB에 사용자를 조회해 옳은 사용자인지 인증한다.    
def authenticate_user(user_name: str, password: str, db: Session) :
    user = get_user_by_username(db, user_name)
    if not user :
        return False 
    if not verify_password(password, user.hashed_password):
        return False
    return user 

## access_token을 생성한다 
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type" : "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt 

## refresh_token을 생성한다 
def create_refresh_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

## access_token을 재 생성한다
def refresh_access_token(refresh_token: str):
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")

        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        # 새 access token 생성
        new_access_token = create_access_token(data={"sub": str(user_id)})
        return {"access_token": new_access_token, "token_type": "bearer"}

    except jwt.ExpiredSignatureError:
        # Refresh Token까지 만료된 경우 → 완전 로그아웃 필요
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired. Please log in again.",
        )
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
## 현재 사용중인 유저 반환 
def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Session):
    # 기본 예외 설정
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # jwt 디코딩 (유효기간 포함 검증)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception

        token_data = TokenData(user_id=user_id)

    except jwt.ExpiredSignatureError:
        # 토큰 만료 시 별도 메시지
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please refresh your token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    except InvalidTokenError:
        # 그 외의 잘못된 토큰
        raise credentials_exception

    # DB에서 사용자 조회
    user = get_user(db, user_id=token_data.user_id)
    if user is None:
        raise credentials_exception

    return user

## 유저가 활성화 상태인지 확인 
async def get_current_active_user(
    current_user: Annotated[UserRead, Depends(get_current_user)],
):
    ## 만약 유저가 활성화 된 유저가 아니라면 
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

