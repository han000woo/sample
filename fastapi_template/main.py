from fastapi import FastAPI
import uvicorn
from apscheduler.schedulers.background import BackgroundScheduler
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
import time
from database.database import Base, engine
from jobs.batch_job import run_batch_job
from routers import store, user,auth, comment
from fastapi.middleware.cors import CORSMiddleware

# --- 스케줄러 설정 ---
scheduler = BackgroundScheduler(timezone="Asia/Seoul")

# --- FastAPI 앱 수명 주기 (Lifespan) ---
@asynccontextmanager
async def lifespan(app: FastAPI) :
    # === 앱 시작 시 ===
    print("FastAPI 앱 시작...")

    # DB 테이블 생성 (이미 있다면 스킵됨)
    # (주의: Alembic 같은 마이그레이션 도구 사용을 권장합니다)
    print("DB 테이블 생성 시도...")
    Base.metadata.create_all(bind=engine) 
    
    # 스케줄러 작업 등록
    scheduler.add_job(
        run_batch_job, 
        'interval', 
        hours=24, # 24시간마다 실행
        # minutes=1, # (테스트용) 1분마다 실행
        # trigger='cron', 
        # hour=3, 
        # minute=0, # (운영용) 매일 새벽 3시에 실행
        id="daily_store_update_job", # 작업 ID
        replace_existing=True
    )

    # 스케줄러 시작
    scheduler.start()
    print("배치 스케줄러 시작됨.")
    
    # (테스트용) 앱 시작 후 5초 뒤에 1회 즉시 실행
    # scheduler.add_job(
    #     run_batch_job,
    #     'date',
    #     run_date=datetime.now() + timedelta(seconds=5)
    # )

    yield # --- 앱 실행 중 ---

    # === 앱 종료 시 ===
    print("FastAPI 앱 종료...")
    scheduler.shutdown()
    print("배치 스케줄러 종료됨.")

Base.metadata.create_all(bind=engine)

scheduler = BackgroundScheduler()
app = FastAPI(
    title="Our Restaurant API",
    description="음식점 정보 배치 업데이트용 FastAPI 서버",
    version="1.0.0",
    lifespan=lifespan
)

# --- 1. CORS 미들웨어 추가 ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 실제 배포 시에는 '*' 대신 프론트엔드 도메인을 지정하세요.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. Static 파일 마운트 ---
# 'static'이라는 디렉터리에 있는 파일들을 '/map' 경로로 서빙합니다.
# (서버 실행 위치에 'static' 디렉터리를 생성해야 합니다)
# app.mount("/map", StaticFiles(directory="./web/static"), name="static")

app.include_router(user.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(store.router, prefix="/api/v1")
app.include_router(comment.router, prefix="/api/v1")

@app.get("/", tags=["Root"])
async def read_root() :
    """
    루트 엔드포인트. API 헬스체크 용도.
    """
    return {"message": "FastAPI 서버가 정상 동작 중입니다."}

if __name__ == "__main__":
    # 개발 환경에서는 uvicorn main:app --reload 로 실행하는 것을 권장합니다.
    uvicorn.run(app, host="0.0.0.0", port=8000)