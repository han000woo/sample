from datetime import timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from jwt import InvalidTokenError
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from auth.schemas import AccessToken, RefreshToken, Tokens
from auth.utils import authenticate_user, create_access_token, create_refresh_token, get_current_active_user, refresh_access_token
from database import get_db


router = APIRouter(prefix="/auth", tags=["Auth"])
# 토큰 만료시간 설정 
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

@router.post("/token",response_model = Tokens)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
) :
    """
    새로운 access토큰과 refresh토큰 생성합니다.
    - **form_data**: 이건 뭘까
    """
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user :
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # accessToken 생성 
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub" : str(user.id)}, expires_delta=access_token_expires
    )
    # refreshToken 생성 
    refresh_token_expires = timedelta(minutes=REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = create_refresh_token(
        data={"sub" : str(user.id)}, expires_delta=refresh_token_expires
    )

    return Tokens(username=user.username,access_token=access_token, refresh_token=refresh_token, token_type="bearer")

# === Refresh Token으로 Access 재발급 ===
@router.post("/refresh", response_model=AccessToken)
def refresh_token(refresh_token: str):
    # 새 Access Token 발급
    new_access_token = refresh_access_token(refresh_token)
    return AccessToken(new_access_token)

# @router.get("/me/", response_model=UserRead)
# async def read_users_me(
#     current_user: Annotated[UserRead, Depends(get_current_active_user)],
# ):
#     return current_user
