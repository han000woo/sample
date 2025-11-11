from pydantic import BaseModel

class AccessToken(BaseModel):
    access_token: str

class RefreshToken(BaseModel):
    refresh_token: str

class Tokens(AccessToken, RefreshToken) :
    username: str
    token_type :str 

class TokenData(BaseModel):
    user_id: int | None = None
