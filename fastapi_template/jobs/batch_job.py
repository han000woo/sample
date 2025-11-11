from datetime import datetime
from typing import List
import httpx
from sqlalchemy.orm import Session
# from sqlalchemy.dialects.postgresql import insert as pg_insert # PostgreSQL 예시
# from sqlalchemy.dialects.mysql import insert as mysql_insert # MySQL 예시
from sqlalchemy.dialects.sqlite import insert as sqlite_insert # SQLite 예시

from database.database import SessionLocal  # database.py의 동기 세션 메이커

# --- [수정] 관계 매핑 오류 해결을 위해 모든 관련 모델 임포트 ---
from models.store import Store
from models.user import User
from models.comment import Comment
# ---
from schemas.store import ApiResponse, StoreItem

# --- 설정 ---
# (중요) 실제 API URL과 서비스 키로 변경해야 합니다.
# 예시 URL (파라미터는 실제 API 명세에 맞게 수정 필요)
EXTERNAL_API_URL = "https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInRadius"
API_SERVICE_KEY = "3z5X80W5P5M023Wv970a1Ju4s2mz+OL2yWxM3yWS9GMXW8kXqDAA5PhyyICfTz6X3jYOvSywDPg9NlVGB5Bkog==" 

def fetch_store_data_from_api() -> List[StoreItem]:
    """
    외부 API를 호출하여 상점 데이터를 가져옵니다.
    (Paging 처리가 필요할 수 있습니다)
    """
    params = {
        "ServiceKey": API_SERVICE_KEY,
        "pageNo": 1,
        "numOfRows": 400, 
        "radius":500,
        "cx":127.047946,
        "cy":37.653299,
        "indsLclsCd":"I2",
        "type" :"json"
    }
    
    try:
        # (주의) httpx는 동기/비동기를 모두 지원합니다. 
        # 여기서는 백그라운드 '스레드'에서 실행될 것이므로 동기(sync) 클라이언트를 사용합니다.
        with httpx.Client() as client:
            response = client.get(EXTERNAL_API_URL, params=params, timeout=30.0)
            response.raise_for_status() # 200 OK가 아니면 예외 발생
            
            # Pydantic 스키마로 데이터 검증 및 파싱
            api_response = ApiResponse.model_validate(response.json())
            
            if api_response.header.get("resultCode") == "00":
                print(f"API 호출 성공: {len(api_response.body.items)}개 데이터 수신")
                return api_response.body.items
            else:
                print(f"API 오류: {api_response.header.get('resultMsg')}")
                return []

    except httpx.HTTPStatusError as e:
        print(f"API 호출 실패 (HTTP Status): {e}")
        return []
    except Exception as e:
        print(f"배치 작업 중 오류 발생 (API 호출): {e}")
        return []

def upsert_stores_to_db(db: Session, items: List[StoreItem]):
    """
    가져온 데이터를 DB에 Upsert (Update or Insert) 합니다.
    (SQLAlchemy 2.0의 db.merge() 또는 DB 고유의 ON CONFLICT 구문 사용)
    """
    if not items:
        print("업데이트할 데이터가 없습니다.")
        return

    # --- 방법 1: SQLAlchemy 2.0 ORM의 merge (가장 간편함) ---
    print("DB Upsert 시작 (merge 방식)...")
    try:
        for item in items:
            # Pydantic 모델(item)을 Store(SQLAlchemy 모델) 인스턴스로 변환
            store_data = item.model_dump()
            
            # [수정] Store 모델에 정의된 '컬럼' 필드만 추려내기
            # comments (relationship)는 컬럼이 아니므로 여기서 걸러집니다.
            model_fields = Store.__table__.columns.keys()
            filtered_data = {k: v for k, v in store_data.items() if k in model_fields}
            
            # 컬럼 데이터만 사용하여 Store 객체 생성
            store_obj = Store(**filtered_data)
            db.merge(store_obj) # PK(bizesId) 기준 merge
        
        db.commit()
        print(f"{len(items)}개 데이터 Upsert 완료.")

    except Exception as e:
        db.rollback()
        print(f"DB Upsert 중 오류 발생: {e}")
    
    # --- 방법 2: 대량 Upsert (주석 처리됨) ---
    # ( ... 기존 주석 코드 ... )


def run_batch_job():
    """
    배치 작업의 메인 함수 (스케줄러가 호출)
    """
    print(f"\n[{datetime.now()}] 배치 작업 시작...")
    
    # 1. DB 세션 생성 (작업 단위로 세션 생성/종료)
    db: Session = SessionLocal()
    
    try:
        # 2. API에서 데이터 가져오기
        items = fetch_store_data_from_api()
        
        # 3. DB에 Upsert
        if items:
            upsert_stores_to_db(db, items)
            
    except Exception as e:
        print(f"배치 작업 메인 프로세스 오류: {e}")
    finally:
        # 4. DB 세션 닫기
        db.close()
        print(f"[{datetime.now()}] 배치 작업 종료.")