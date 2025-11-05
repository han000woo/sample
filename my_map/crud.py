from sqlalchemy.orm import Session
from auth.hashing import get_password_hash
import models
import schemas

# --- User CRUD ---
def get_user(db: Session, user_id: int) :
    """ID로 단일 사용자 조회"""
    return db.query(models.User).filter(models.User.id == user_id).first() 

def get_user_by_username(db: Session, username: str) :
    """UserName으로 단일 사용자 조회"""
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_email(db: Session, email: str) :
    """이메일로 단일 사용자 조회"""
    return db.query(models.User).filter(models.User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    """여러 사용자 조회 (페이지네이션)"""
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db:Session, user: schemas.UserCreate) :
    """새로운 사용자 생성"""
    hashed_password = get_password_hash(user.password) #실제로는 bcrypt 사용 
    db_user = models.User(
        email = user.email, 
        username = user.username,
        hashed_password = hashed_password 
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
    
# --- Comment CRUD ---
def get_comments(db: Session, skip : int = 0, limit:int = 100):
    """여러 댓글 조회 (페이지네이션)"""
    return db.query(models.Comment).offset(skip).limit(limit).all()

def create_user_comment(db: Session, comment: schemas.CommentCreate, user_id: int) :
    """특정 사용자의 새로운 댓글 생성"""
    db_comment = models.Comment(**comment.model_dump(), owner_id=user_id)
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment 

def update_user_comment(db: Session, comment: schemas.CommentUpdate, user_id: int) :
    """특정 사용자의 댓글 수정"""
    db_comment = db.query(models.Comment).filter(
        models.Comment.id == comment.id
    ).first()
    
    # 댓글이 존재하지 않을 경우 
    if not db_comment :
        return None 
    
    # 댓글이 소유자가 아닐 경우
    if user_id != comment.owner_id :
        return None 
    
    # Pydantic v2: exclude_unset=True는 명시적으로 제공된 값만 반환
    update_data = comment.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        # 'tag_ids'는 관계 필드이므로 setattr로 직접 설정하지 않습니다.
        if key != "tags" and hasattr(db_comment, key):
            setattr(db_comment, key, value)

    # 3. 태그 업데이트 (요청하신 부분)
    # 'tags' 필드가 업데이트 요청에 포함되었는지 확인
    if "tags" in update_data:
        new_tag_ids = update_data.get("tags") # None일 수도 있음
        print(new_tag_ids)
        if new_tag_ids is None or not new_tag_ids: 
            # 태그를 빈 리스트로 설정하라는 명시적 요청 (모두 제거)
            db_comment.tags.clear()
        else:
            # 새 태그 ID 목록을 기반으로 태그 객체 목록을 조회
            new_tags = []
            for new_tag_id in new_tag_ids:
                tag = get_tag_by_id(db, new_tag_id) 
                if tag:
                    new_tags.append(tag)
            
            # SQLAlchemy가 다대다 관계(tags)를 자동으로 업데이트합니다.
            # (기존 연결을 지우고 새 목록으로 교체)
            db_comment.tags = new_tags 

    db.add(db_comment) # 세션에 변경사항 추가
    db.commit()
    db.refresh(db_comment)
    return db_comment

def delete_user_comment(db:Session, comment_id : int, user_id:int) :
    """특정 사용자의 댓글 삭제"""
    print(comment_id)
    db_comment = db.query(models.Comment).filter(
        models.Comment.id == comment_id
    ).first()
    
    # 댓글이 존재하지 않을 경우 
    if not db_comment :
        return None 
    
    # 댓글이 소유자가 아닐 경우
    if user_id != db_comment.owner_id :
        return None 
    
    db.delete(db_comment)
    db.commit()

    return True 

    
def get_comment_by_id(db: Session, comment_id: int) :
    """ID로 단일 댓글 조회"""
    return db.query(models.Comment).filter(models.Comment.id == comment_id).first()

# --- Tag CRUD ---
def get_tags(db: Session, skip: int = 0, limit: int = 100):
    """여러 태그 조회 (페이지네이션)"""
    return db.query(models.Tag).offset(skip).limit(limit).all() 

def get_tag_by_name(db: Session, name: str) :
    """이름으로 단일 태그 조회"""
    return db.query(models.Tag).filter(models.Tag.name == name).first() 

def create_tag(db: Session,tag: schemas.TagCreate) :
    """새로운 태그 생성"""
    db_tag = models.Tag(name=tag.name) 
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag

def get_tag_by_id(db: Session, tag_id: int) :
    """ID로 단일 태그 조회"""
    return db.query(models.Tag).filter(models.Tag.id == tag_id).first()

# --- 관계(Relationship) CRUD ---
def add_tag_to_comment(db: Session, comment_id: int, tag_id: int) :
    """댓글에 태그 추가 (다대다 관계)"""
    db_comment = get_comment_by_id(db, comment_id)
    db_tag = get_tag_by_id(db, tag_id)

    if not db_comment or not db_tag :
        return None 
    
    if db_tag not in db_comment.tags :
        db_comment.tags.append(db_tag)
        db.commit()
        db.refresh(db_comment)

    return db_comment



