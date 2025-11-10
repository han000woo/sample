# auth/hashing.py
from passlib.context import CryptContext

# bcrypt 해시를 사용하도록 설정
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# password를 해싱한다
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# password 검증
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
