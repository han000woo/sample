import time
from fastapi import FastAPI
import uvicorn
from apscheduler.schedulers.background import BackgroundScheduler
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
import pytz
# --- [신규] DB 연결 재시도를 위한 임포트 ---
from sqlalchemy.exc import OperationalError
from sqlalchemy import text # [신규] text 임포트 (SELECT 1용)
from database.database import Base, engine, SessionLocal
# ---

# [수정] 라우터 임포트 (신규 'favorite' 라우터 포함)
from jobs.batch_job import run_batch_job
from routers import store, user, auth, comment, favorite

from fastapi.middleware.cors import CORSMiddleware

# --- 스케줄러 설정 ---
kst = pytz.timezone('Asia/Seoul')
scheduler = BackgroundScheduler(timezone=kst)

# --- FastAPI 앱 수명 주기 (Lifpan) ---
@asynccontextmanager
async def lifespan(app: FastAPI) :
    # === 앱 시작 시 ===
    print("FastAPI 앱 시작...")

    # [신규] DB 연결 재시도 (Docker 레이스 컨디션 해결)
    max_retries = 10
    retry_delay = 3 # 3초
    for attempt in range(max_retries):
        try:
            # DB 세션을 생성하려 시도
            db = SessionLocal()
            # DB에 간단한 쿼리 시도
            db.execute(text("SELECT 1"))
            db.close()
            
            print("DB 연결 성공.")
            
            # DB 테이블 생성 (이미 있다면 스킵됨)
            print("DB 테이블 생성 시도...")
            Base.metadata.create_all(bind=engine) 
            print("DB 테이블 생성 완료.")
            break # 연결 성공 시 루프 탈출
            
        except OperationalError as e:
            print(f"DB 연결 실패 (시도 {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                print(f"{retry_delay}초 후 재시도합니다...")
                time.sleep(retry_delay)
            else:
                print("DB 연결에 최종 실패했습니다. 앱을 종료합니다.")
                raise # 재시도 모두 실패 시 앱 시작 중단
        except Exception as e:
            # [수정] text가 정의되지 않는 오류 해결
            # OperationalError 외의 다른 예외 (예: NameError) 처리
            print(f"DB 초기화 중 예기치 않은 오류 발생: {e}")
            if "name 'text' is not defined" in str(e):
                print("힌트: 'from sqlalchemy import text'를 추가했는지 확인하세요.")
            raise

    
    # 스케줄러 작업 등록
    scheduler.add_job(
        run_batch_job, 
        'interval', 
        hours=24, # 24시간마다 실행
        # seconds=30,
        id="daily_store_update_job",
        replace_existing=True
    )

    # 스케줄러 시작
    scheduler.start()
    print("배치 스케줄러 시작됨.")
    
    # (테스트용) 앱 시작 후 5초 뒤에 1회 즉시 실행
    scheduler.add_job(
        run_batch_job,
        'date',
        run_date=datetime.now() + timedelta(seconds=5),
        id="initial_batch_run", # ID 추가,,
        misfire_grace_time=600  # 600초(10분)까지 허용

    )
    print("앱 시작 5초 후 배치 작업 1회 실행 예약됨.")

    yield # --- 앱 실행 중 ---

    # === 앱 종료 시 ===
    print("FastAPI 앱 종료...")
    scheduler.shutdown()
    print("배치 스케줄러 종료됨.")

# --- FastAPI 앱 생성 ---
app = FastAPI(
    title="Our Restaurant API",
    description="음식점 정보 배치 업데이트용 FastAPI 서버",
    version="1.0.0",
    lifespan=lifespan # [수정] lifespan 함수 등록
)

# --- 1. CORS 미들웨어 추가 ---
# (이 부분이 이미 올바르게 설정되어 있습니다)
app.add_middleware(
    CORSMiddleware,
    # [설정] allow_origins=["*"]는 개발 중에는 편리하지만,
    # 실제 배포 시에는 Nginx가 프록시를 하므로 (예: http://localhost:8080)
    # FastAPI 수준에서는 이 설정이 필요 없거나,
    # Nginx 프록시 서버의 주소만 명시적으로 허용할 수 있습니다.
    # Docker 배포 환경에서는 Vue(Nginx)와 FastAPI(Uvicorn)가 다른 컨테이너에 있으므로
    # 이 설정은 사실상 Nginx에 의해 무시됩니다.
    # 하지만 만약 Vue 앱을 로컬에서 띄우고(예: npm run dev) 
    # Docker의 백엔드(localhost:8000)에 직접 붙으려 한다면 이 설정이 필요합니다.
    
    # Nginx 프록시를 사용하므로 Vue 앱의 실제 출처(Origin)는 FastAPI에 도달하지 않습니다.
    # 하지만 만약 Nginx 설정 없이,
    # 로컬 Vue(http://localhost:5173)에서 Docker 백엔드(http://localhost:8000)로 직접 요청 시
    allow_origins=["http://localhost:5173", "http://localhost:8080", "*"], 
    allow_credentials=True,
    allow_methods=["*"], # 모든 HTTP 메소드 허용
    allow_headers=["*"], # 모든 HTTP 헤더 허용
)

# --- 2. 라우터 등록 ---
# (main.py의 prefix="/api/v1" + user.router의 prefix="/users")
# 예: /api/v1/users/
app.include_router(user.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(store.router, prefix="/api/v1")
app.include_router(comment.router, prefix="/api/v1") # [신규] comment 라우터
app.include_router(favorite.router, prefix="/api/v1") # [신규] favorite 라우터

# --- 3. 루트 엔드포인트 ---
@app.get("/", tags=["Root"])
async def read_root() :
    """
    루트 엔드포인트. API 헬스체크 용도.
    """
    return {"message": "FastAPI 서버가 정상 동작 중입니다."}

# (이 파일이 uvicorn으로 직접 실행되지는 않지만,
#  테스트를 위해 main 실행 구문을 남겨둘 수 있습니다)
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)