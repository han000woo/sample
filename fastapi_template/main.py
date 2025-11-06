from fastapi import FastAPI
import uvicorn
from database import Base, engine
from routers import comment, tag, user,auth
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="",
    description="",
    version="1.0.0"
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

@app.get("/", tags=["Root"])
async def read_root() :
    """
    루트 엔드포인트. API 헬스체크 용도.
    """
    return {"message": "FastAPI 서버가 정상 동작 중입니다."}

if __name__ == "__main__":
    # 개발 환경에서는 uvicorn main:app --reload 로 실행하는 것을 권장합니다.
    uvicorn.run(app, host="0.0.0.0", port=8000)