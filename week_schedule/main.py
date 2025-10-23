import webview
import os
import base64
import shutil
from datetime import datetime
import sys  # ✅ 1. sys 모듈을 임포트합니다.


def get_current_dir():
    """
    실행 파일(.exe)로 실행되었는지,
    일반 스크립트로 실행되었는지 확인하고 올바른 경로를 반환합니다.
    """
    if getattr(sys, "frozen", False):
        # ".exe"로 실행된 경우 (PyInstaller가 sys.frozen을 True로 설정)
        # sys._MEIPASS는 임시 폴더의 경로입니다.
        return sys._MEIPASS
    else:
        # 일반 "python main.py"로 실행된 경우
        return os.path.dirname(os.path.abspath(__file__))


# 현재 경로 기준으로 HTML 파일 경로 찾기
current_dir = get_current_dir()
html_path = os.path.join(current_dir, "index.html")


# --- ▼▼▼ [신규] API 클래스 정의 (v6.1 - 공식 문서 기반) ▼▼▼ ---
class Api:
    def __init__(self):
        # ✨ [수정] window 객체를 다시 참조합니다.
        self._window = None

    def set_window(self, window):
        self._window = window

    # 1. 이미지 저장 함수
    def save_image(self, data_url):
        if not self._window:
            return

        date_str = datetime.now().strftime("%Y-%m-%d")
        filename = f"주간시간표_{date_str}.png"

        # 1. "다른 이름으로 저장" 대화상자 띄우기
        # ✨ [수정] 공식 문서의 'create_file_dialog'를 사용합니다.
        result = self._window.create_file_dialog(
            webview.FileDialog.SAVE,  # 저장 대화상자
            directory=os.path.expanduser("~"),
            save_filename=filename,
        )

        # 2. 사용자가 경로를 선택했으면 (result는 튜플 또는 단일 문자열일 수 있음)
        # v6에서 save dialog는 선택된 파일 경로(문자열)를 반환합니다.
        if result:
            save_path = result[0]
            try:
                header, encoded = data_url.split(",", 1)
                img_data = base64.b64decode(encoded)

                with open(save_path, "wb") as f:
                    f.write(img_data)
            except Exception as e:
                print(f"이미지 저장 오류: {e}")

    # 2. 엑셀 양식 저장 함수
    def save_excel_demo(self):
        if not self._window:
            return

        source_path = os.path.join(current_dir, "data", "demo.xlsx")

        if not os.path.exists(source_path):
            print("오류: data/demo.xlsx 파일을 찾을 수 없습니다.")
            return

        # 1. "다른 이름으로 저장" 대화상자 띄우기
        # ✨ [수정] 'create_file_dialog'를 사용합니다.
        result = self._window.create_file_dialog(
            webview.FileDialog.SAVE,
            directory=os.path.expanduser("~"),
            save_filename="일정_입력_양식.xlsx",
        )

        # 2. 사용자가 경로를 선택했으면
        if result:
            save_path = result[0]
            try:
                shutil.copyfile(source_path, save_path)
            except Exception as e:
                print(f"엑셀 파일 저장 오류: {e}")


# --- ▲▲▲ [신규] API 클래스 정의 끝 ▲▲▲ ---


# API 인스턴스 생성
api = Api()

# PyWebview 윈도우 생성
window = webview.create_window(
    title="주간 시간표 배치",
    url=f"file://{html_path}",
    resizable=True,
    maximized=True,
    js_api=api,  # js_api 등록
)

# ✨ [수정] API 클래스가 window 객체를 참조할 수 있도록 다시 설정
api.set_window(window)

webview.start()
