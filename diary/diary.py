import customtkinter as ctk
import os
from tkinter import messagebox
import datetime

# --- 설정 ---
DIARY_DIR = "diary_entries"
ctk.set_appearance_mode("System")
ctk.set_default_color_theme("blue")

class SimpleDiaryApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("나의 심플 일기장")
        self.geometry("900x600")

        # 일기 디렉토리 생성
        if not os.path.exists(DIARY_DIR):
            os.makedirs(DIARY_DIR)

        # ######################################
        # ## 오타가 수정된 부분입니다.
        # ######################################
        self.grid_columnconfigure(1, weight=1) # _ 제거
        self.grid_rowconfigure(0, weight=1)    # _ 제거

        # --- 왼쪽 프레임 (일기 목록) ---
        self.left_frame = ctk.CTkFrame(self, width=250, corner_radius=0)
        self.left_frame.grid(row=0, column=0, rowspan=2, sticky="nsew")
        self.left_frame.grid_rowconfigure(1, weight=1)
        
        self.list_label = ctk.CTkLabel(self.left_frame, text="일기 목록", font=ctk.CTkFont(size=20, weight="bold"))
        self.list_label.grid(row=0, column=0, padx=20, pady=(20, 10))
        
        self.scrollable_frame = ctk.CTkScrollableFrame(self.left_frame, label_text="")
        self.scrollable_frame.grid(row=1, column=0, padx=15, pady=15, sticky="nsew")
        
        # --- 오른쪽 프레임 (텍스트 편집기) ---
        self.right_frame = ctk.CTkFrame(self)
        self.right_frame.grid(row=0, column=1, padx=20, pady=20, sticky="nsew")
        self.right_frame.grid_rowconfigure(0, weight=1)
        self.right_frame.grid_columnconfigure(0, weight=1)

        self.textbox = ctk.CTkTextbox(self, font=("Malgun Gothic", 15), wrap="word", border_spacing=10)
        self.textbox.grid(row=0, column=1, padx=20, pady=20, sticky="nsew")
        
        # --- 하단 버튼 프레임 ---
        self.button_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.button_frame.grid(row=1, column=1, sticky="ew", padx=20, pady=(0, 10))
        
        self.new_button = ctk.CTkButton(self.button_frame, text="새 일기", command=self.new_entry)
        self.new_button.pack(side="left", padx=(0, 10), pady=10)

        self.save_button = ctk.CTkButton(self.button_frame, text="저장하기", command=self.save_entry)
        self.save_button.pack(side="left", padx=10, pady=10)
        
        self.delete_button = ctk.CTkButton(self.button_frame, text="삭제", command=self.delete_entry, fg_color="#DB4437", hover_color="#C53727")
        self.delete_button.pack(side="right", padx=10, pady=10)

        # 초기화
        self.current_file = None
        self.list_widgets = []
        self.load_entries()

    def load_entries(self):
        """디렉토리에서 일기 목록을 불러와 왼쪽에 표시"""
        for widget in self.list_widgets:
            widget.destroy()
        self.list_widgets.clear()

        entries = sorted([f for f in os.listdir(DIARY_DIR) if f.endswith(".txt")], reverse=True)
        for entry in entries:
            try:
                date_str = entry.split('_')[0]
                title = os.path.splitext(entry.split('_', 1)[1])[0]
                
                entry_frame = ctk.CTkFrame(self.scrollable_frame, fg_color="transparent")
                entry_frame.pack(fill="x", pady=2, padx=5)

                date_label = ctk.CTkLabel(entry_frame, text=date_str, font=ctk.CTkFont(size=12))
                date_label.pack(anchor="w")

                title_button = ctk.CTkButton(entry_frame, text=title, anchor="w",
                                             font=ctk.CTkFont(size=14, weight="bold"),
                                             command=lambda e=entry: self.select_entry(e))
                title_button.pack(fill="x")
                
                self.list_widgets.extend([entry_frame, date_label, title_button])
            except IndexError:
                pass

    def select_entry(self, filename):
        """목록에서 일기를 선택했을 때 내용을 불러옴"""
        self.current_file = filename
        filepath = os.path.join(DIARY_DIR, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            self.textbox.delete("1.0", "end")
            self.textbox.insert("1.0", content)

    def new_entry(self):
        """'새 일기' 버튼 클릭 시 편집창 초기화"""
        self.current_file = None
        self.textbox.delete("1.0", "end")

    def save_entry(self):
        """'저장' 버튼 클릭 시 내용을 파일로 저장"""
        content = self.textbox.get("1.0", "end-1c").strip()
        if not content:
            messagebox.showwarning("경고", "일기 내용을 입력해주세요.")
            return

        if self.current_file is None:
            first_line = content.split('\n')[0]
            title = "".join(x for x in first_line if x.isalnum() or x in " _-").strip() or "제목 없음"
            date_str = datetime.date.today().strftime("%Y-%m-%d")
            
            base_filename = f"{date_str}_{title[:30]}.txt"
            filename = base_filename
            count = 1
            while os.path.exists(os.path.join(DIARY_DIR, filename)):
                filename = f"{date_str}_{title[:30]}_{count}.txt"
                count += 1
            self.current_file = filename
        else:
            filename = self.current_file

        filepath = os.path.join(DIARY_DIR, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        
        self.load_entries()
        messagebox.showinfo("알림", f"'{filename}'으로 저장되었습니다.")

    def delete_entry(self):
        """'삭제' 버튼 클릭 시 선택된 파일 삭제"""
        if not self.current_file:
            messagebox.showwarning("경고", "삭제할 일기를 목록에서 선택해주세요.")
            return

        if messagebox.askyesno("삭제 확인", f"'{self.current_file}' 일기를 정말 삭제하시겠습니까?"):
            os.remove(os.path.join(DIARY_DIR, self.current_file))
            self.new_entry()
            self.load_entries()
            messagebox.showinfo("알림", "선택한 일기가 삭제되었습니다.")

if __name__ == "__main__":
    app = SimpleDiaryApp()
    app.mainloop()