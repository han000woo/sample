import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
import tkinter as tk
from tkinter import messagebox, filedialog, ttk

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/142.0.0.0 Safari/537.36",
    "Referer": "https://www.aladin.co.kr/",
}

# -------------------------------
# 크롤링 함수
# -------------------------------
def scrape_aladin_yearly_best(start_year, end_year, max_rank, delay, progress_var, status_label, root):
    base_url = "https://www.aladin.co.kr/shop/common/wbest.aspx"
    rows = []

    total_years = end_year - start_year + 1
    step_per_year = 100 / total_years  # 진행률 계산

    for year_index, year in enumerate(range(start_year, end_year + 1)):
        status_label.config(text=f"{year}년도 데이터 수집 중...")
        root.update_idletasks()

        params = {
            "BestType": "YearlyBest",
            "BranchType": 1,
            "CID": 13789,
            "Year": year,
            "cnt": max_rank,
            "page": 1,
        }

        resp = requests.get(base_url, params=params, headers=headers)
        if resp.status_code != 200:
            print(f"Failed to get data for year {year}, status code: {resp.status_code}")
            continue

        soup = BeautifulSoup(resp.text, "html.parser")
        book_items = soup.select("div.ss_book_box")

        for idx, item in enumerate(book_items):
            rank = idx + 1
            if rank > max_rank:
                break

            ss_book_list = item.select_one("div.ss_book_list")
            li_list = ss_book_list.select("li")

            title = ""
            author = ""
            publisher = ""
            pub_date = ""
            price = ""
            start = 1 if len(li_list) == 5 else 0

            for li in li_list[start:]:
                text = li.get_text(" ", strip=True)

                # 제목
                title_tag = li.select_one("a.bo3")
                if title_tag and not title:
                    title = title_tag.get_text(strip=True)
                    continue

                # 저자/출판사/출간일
                if "|" in text:
                    parts = [p.strip() for p in text.split("|")]
                    if len(parts) >= 3:
                        author = parts[0]
                        publisher = parts[1]
                        pub_date = parts[2]
                    continue

                # 정가
                if "원" in text or "FREE" in text:
                    free_tag = li.select_one("span.free_label em")
                    if free_tag:
                        price = free_tag.get_text(strip=True)
                    else:
                        span_tag = li.select_one("span")
                        if span_tag:
                            price = span_tag.get_text(strip=True)
                    continue

            category_tag = item.select_one("div.ss_book_list > a:nth-of-type(1)")
            category = category_tag.get_text(strip=True) if category_tag else None

            rows.append(
                {
                    "연도": year,
                    "순위": rank,
                    "제목": title,
                    "국내/외": category,
                    "저자": author,
                    "출판사": publisher,
                    "출간일": pub_date,
                    "정가": price,
                }
            )

        # 진행률 업데이트
        progress_var.set((year_index + 1) * step_per_year)
        root.update_idletasks()

        time.sleep(delay)

    return pd.DataFrame(rows)


# -------------------------------
# 버튼 클릭 시 동작
# -------------------------------
def start_scraping():
    try:
        start_year = int(entry_start.get())
        end_year = int(entry_end.get())
        max_rank = int(entry_rank.get())
    except ValueError:
        messagebox.showerror("입력 오류", "년도와 최대 순위는 숫자로 입력해야 합니다.")
        return

    file_path = filedialog.asksaveasfilename(
        defaultextension=".xlsx", filetypes=[("Excel files", "*.xlsx")]
    )
    if not file_path:
        return

    progress_var.set(0)
    status_label.config(text="크롤링 준비 중...")

    try:
        df = scrape_aladin_yearly_best(
            start_year, end_year, max_rank, 0.8, progress_var, status_label, root
        )
        df.to_excel(file_path, index=False)

        progress_var.set(100)
        status_label.config(text="완료!")
        messagebox.showinfo("완료", f"엑셀 저장 완료: {file_path}")
    except Exception as e:
        messagebox.showerror("오류", f"크롤링 중 오류 발생:\n{e}")


# -------------------------------
# GUI 구성
# -------------------------------
root = tk.Tk()
root.title("알라딘 연간 베스트셀러 크롤러")

tk.Label(root, text="시작년도:").grid(row=0, column=0, padx=5, pady=5)
entry_start = tk.Entry(root)
entry_start.grid(row=0, column=1, padx=5, pady=5)

tk.Label(root, text="종료년도:").grid(row=1, column=0, padx=5, pady=5)
entry_end = tk.Entry(root)
entry_end.grid(row=1, column=1, padx=5, pady=5)

tk.Label(root, text="최대 순위:").grid(row=2, column=0, padx=5, pady=5)
entry_rank = tk.Entry(root)
entry_rank.grid(row=2, column=1, padx=5, pady=5)

btn_start = tk.Button(root, text="크롤링 시작", command=start_scraping)
btn_start.grid(row=3, column=0, columnspan=2, pady=10)

# 진행바
progress_var = tk.DoubleVar()
progress_bar = ttk.Progressbar(root, variable=progress_var, maximum=100, length=250)
progress_bar.grid(row=4, column=0, columnspan=2, pady=10)

# 진행 상태 문구
status_label = tk.Label(root, text="대기 중...")
status_label.grid(row=5, column=0, columnspan=2, pady=5)

root.mainloop()

