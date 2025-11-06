from sqlalchemy.orm import Session
from auth.hashing import get_password_hash
import models.user_model as user_model
import schemas.user as user

# --- User CRUD ---
def get_user(db: Session, user_id: int) :
    """ID로 단일 사용자 조회"""
    return db.query(user_model.User).filter(user_model.User.id == user_id).first() 

def get_user_by_username(db: Session, username: str) :
    """UserName으로 단일 사용자 조회"""
    return db.query(user_model.User).filter(user_model.User.username == username).first()

def get_user_by_email(db: Session, email: str) :
    """이메일로 단일 사용자 조회"""
    return db.query(user_model.User).filter(user_model.User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    """여러 사용자 조회 (페이지네이션)"""
    return db.query(user_model.User).offset(skip).limit(limit).all()

def create_user(db:Session, user: user.UserCreate) :
    """새로운 사용자 생성"""
    hashed_password = get_password_hash(user.password) #실제로는 bcrypt 사용 
    db_user = user_model.User(
        email = user.email, 
        username = user.username,
        hashed_password = hashed_password 
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
    


