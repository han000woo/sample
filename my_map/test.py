import jwt

# 에러가 발생하는 토큰과 키를 그대로 넣어보세요.
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImV4cCI6MTc2MjM0MzIxMywidHlwZSI6ImFjY2VzcyJ9.njZcAdb52DRxT4z5uMummvlpQAoxGNel56GUExY3ezY"
SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"

try:
    # 1. 서명 검증만 제외하고 디코딩 시도 (키 문제 확인)
    # decode_without_verify는 디코딩이 잘 되는지 확인하기 위한 임시 코드입니다.
    payload_no_verify = jwt.decode(
        token,
        options={"verify_signature": False}, # 서명 검증 없이
        algorithms=[ALGORITHM]
    )
    print(f"✅ 서명 검증 없이 디코딩 성공: {payload_no_verify}")
    
    # 2. 전체 디코딩 시도 (만료/키 문제 확인)
    payload_full = jwt.decode(
        token, 
        SECRET_KEY, 
        algorithms=[ALGORITHM], 
        # 만료 에러가 의심되면 아래 옵션을 추가해 보세요.
        # options={"verify_exp": False} 
    )
    print(f"🎉 최종 디코딩 성공: {payload_full}")

except jwt.ExpiredSignatureError:
    print("❌ 에러: 토큰이 만료되었습니다. (ExpiredSignatureError)")
except jwt.InvalidSignatureError:
    print("❌ 에러: 시크릿 키가 일치하지 않거나 토큰이 변조되었습니다. (InvalidSignatureError)")
except Exception as e:
    print(f"❌ 기타 에러 발생: {e}")