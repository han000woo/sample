import pandas as pd
import random

# 📘 파일 인코딩을 cp949로 변경
df = pd.read_csv("testcsv.csv", encoding="cp949")

# ISBN, 재고 랜덤 생성
df["ISBN"] = [str(random.randint(9780000000000, 9789999999999)) for _ in range(len(df))]
df["재고"] = [random.randint(1, 10) for _ in range(len(df))]

# TXT로 저장 (구분자는 |)
with open("book_output.txt", "w", encoding="utf-8") as f:
    for _, row in df.iterrows():
        f.write(f"{row.iloc[0]}${row.iloc[1]}${row['ISBN']}${row['재고']}\n")

print("✅ book_output.txt 생성 완료!")
