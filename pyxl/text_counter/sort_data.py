import pandas as pd
import tkinter as tk
from tkinter import messagebox
import re
import matplotlib.pyplot as plt
import os

# --------------------------
# 데이터 처리 함수
# --------------------------

def generate_txt():
    try:
        df = pd.read_excel("data.xlsx")
    except FileNotFoundError:
        messagebox.showerror("오류", "data.xlsx 파일이 존재하지 않습니다.")
        return
    
    # 주제어 컬럼 정리
    df.rename(columns={"주제어 (3개)":"주제어"}, inplace=True)
    df["주제어"] = df["주제어"].apply(lambda x: [item.strip() for item in str(x).split(",")])

    interval = int(interval_entry.get())
    min_year = df["연도"].min()
    max_year = df["연도"].max()

    # explode + groupby 없이 Counter로 처리
    from collections import Counter
    yearly_keyword_counter = df.groupby("연도")["주제어"].apply(
        lambda s: sum((kw for kw in s), [])
    )

    # interval별 요약
    summary_lines = []
    summary_lines.append(f"{min_year}년 ~ {max_year}년, {interval}년 단위 분석 결과\n")

    for year in range(min_year, max_year + 1, interval):
        summary_lines.append(f"\n=== {year}년 ~ {year + interval - 1}년 ===")
        interval_counter = Counter()
        for y in range(year, year + interval):
            if y in yearly_keyword_counter.index:
                interval_counter.update(yearly_keyword_counter[y])
        for word, count in interval_counter.items():
            summary_lines.append(f"{word}: {count}회")

    # txt 파일 저장
    with open("keyword_summary.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(summary_lines))

    messagebox.showinfo("완료", "keyword_summary.txt 생성 완료!")

# --------------------------
# txt 읽고 막대그래프 저장
# --------------------------

def generate_graphs():

    plt.rcParams['axes.unicode_minus'] = False
    plt.rcParams['font.family'] ='Malgun Gothic'
    
    if not os.path.exists("keyword_summary.txt"):
        messagebox.showerror("오류", "keyword_summary.txt 파일이 존재하지 않습니다.")
        return

    with open("keyword_summary.txt", "r", encoding="utf-8") as f:
        text = f.read()

    # 구간 추출
    interval_blocks = re.findall(r"=== (\d+)년 ~ (\d+)년 ===(.*?)(?===|\Z)", text, flags=re.S)

    for start, end, block_text in interval_blocks:
        freq_dict = {}
        for line in block_text.strip().split("\n"):
            if ":" in line:
                word, count = line.split(":")
                freq_dict[word.strip()] = int(count.replace("회","").strip())

        # 상위 20개 단어 추출
        top_words = dict(sorted(freq_dict.items(), key=lambda x: x[1], reverse=True)[:20])

        # 그래프 그리기
        plt.figure(figsize=(12,6))
        plt.bar(top_words.keys(), top_words.values(), color="skyblue")
        plt.title(f"{start}년 ~ {end}년 주제어 TOP 20")
        plt.xlabel("주제어")
        plt.ylabel("횟수")
        plt.xticks(rotation=45)
        plt.tight_layout()
        filename = f"keyword_{start}_{end}.png"
        plt.savefig(filename)
        plt.close()

    messagebox.showinfo("완료", "모든 구간 그래프 이미지 저장 완료!")

# --------------------------
# Tkinter GUI 구성
# --------------------------

root = tk.Tk()
root.title("주제어 분석 및 시각화")

tk.Label(root, text="분석 구간(년 단위):").grid(row=0, column=0, padx=5, pady=5)
interval_entry = tk.Entry(root)
interval_entry.insert(0, "5")  # 기본값
interval_entry.grid(row=0, column=1, padx=5, pady=5)

tk.Button(root, text="1. data.xlsx → txt 생성", command=generate_txt, width=25).grid(row=1, column=0, columnspan=2, padx=5, pady=5)
tk.Button(root, text="2. txt → 구간별 그래프 저장", command=generate_graphs, width=25).grid(row=2, column=0, columnspan=2, padx=5, pady=5)


root.mainloop()
