import openpyxl
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
import datetime
import calendar
import random
from collections import defaultdict

# 1. input 리스트 (샘플 데이터)
input_list = [
    {'계약': '주 5회', '성명': '김민준', '입사일': '2023-01-15', '근로계약 기간': '1년', '메모': ''},
    {'계약': '주 5회', '성명': '이서연', '입사일': '2023-02-20', '근로계약 기간': '1년', '메모': '오전 선호'},
    {'계약': '주 5회', '성명': '박도윤', '입사일': '2023-03-10', '근로계약 기간': '1년', '메모': ''},
    {'계약': '주 5회', '성명': '최아윤', '입사일': '2023-04-05', '근로계약 기간': '1년', '메모': ''},
    {'계약': '주 5회', '성명': '정시우', '입사일': '2023-05-12', '근로계약 기간': '1년', '메모': '신입'},
    {'계약': '주 5회', '성명': '추가인원1', '입사일': '2023-01-01', '근로계약 기간': '1년', '메모': ''},
    {'계약': '주 5회', '성명': '추가인원2', '입사일': '2023-01-01', '근로계약 기간': '1년', '메모': ''},
    {'계약': '주 5회', '성명': '추가인원3', '입사일': '2023-01-01', '근로계약 기간': '1년', '메모': ''},
    {'계약': '주 4회', '성명': '강하은', '입사일': '2023-06-18', '근로계약 기간': '1년', '메모': ''},
    {'계약': '주 4회', '성명': '조지호', '입사일': '2023-07-22', '근로계약 기간': '1년', '메모': ''},
    {'계약': '주 2회', '성명': '윤채원', '입사일': '2023-08-30', '근로계약 기간': '6개월', '메모': '주말 근무 가능'},
    {'계약': '주 2회', '성명': '장서준', '입사일': '2023-09-01', '근로계약 기간': '6개월', '메모': ''},
]

# --- 설정값 ---
YEAR = None
MONTH = None
MIN_WEEKDAY_STAFF = 5
MAX_WEEKDAY_STAFF = 6
WEEKEND_STAFF_COUNT = 6 # 주말 근무 인원을 6명으로 변경
START_ROW = 5

# --- 스타일 정의 ---
HEADER_FILL = PatternFill(start_color="D9D9D9", end_color="D9D9D9", fill_type="solid")
WORK_FILL = PatternFill(start_color="C6E0B4", end_color="C6E0B4", fill_type="solid")
CENTER_ALIGN = Alignment(horizontal='center', vertical='center')
TITLE_FONT = Font(size=18, bold=True)
BOLD_FONT = Font(bold=True)
BLUE_FONT = Font(color="0000FF", bold=True)
RED_FONT = Font(color="FF0000", bold=True)
THIN_SIDE = Side(style="thin")
TABLE_BORDER = Border(left=THIN_SIDE, right=THIN_SIDE, top=THIN_SIDE, bottom=THIN_SIDE)

def create_schedule():
    """근무 스케줄 엑셀 파일을 생성하는 메인 함수"""
    wb = openpyxl.Workbook()
    ws = wb.active

    now = datetime.datetime.now()
    year = YEAR if YEAR else now.year
    month = MONTH if MONTH else now.month
    ws.title = f"{year}년 {month}월 스케줄"

    output_filename = f"{year}년 {month}월 근무표.xlsx"

    _, num_days = calendar.monthrange(year, month)
    info_headers = list(input_list[0].keys())
    summary_headers = ["평일 근무", "주말 근무"]
    
    last_col_num = len(info_headers) + num_days + len(summary_headers)

    # 제목 생성
    title_text = f"{year}년 {month}월 근무표"
    ws.merge_cells(start_row=2, start_column=1, end_row=3, end_column=last_col_num)
    title_cell = ws.cell(row=2, column=1, value=title_text)
    title_cell.font = TITLE_FONT
    title_cell.alignment = CENTER_ALIGN

    # 헤더 생성
    for col, header in enumerate(info_headers, 1):
        cell = ws.cell(row=START_ROW, column=col, value=header)
        cell.fill = HEADER_FILL
        cell.font = BOLD_FONT
        cell.alignment = CENTER_ALIGN
    
    date_col_start = len(info_headers) + 1
    weekdays = ["월", "화", "수", "목", "금", "토", "일"]
    for day in range(1, num_days + 1):
        date = datetime.date(year, month, day)
        col = date_col_start + day - 1
        day_cell = ws.cell(row=START_ROW, column=col, value=f"{day}\n{weekdays[date.weekday()]}")
        day_cell.fill = HEADER_FILL
        day_cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        if date.weekday() == 5: day_cell.font = BLUE_FONT
        elif date.weekday() == 6: day_cell.font = RED_FONT

    # 인원 정보 기입
    employee_row_map = {}
    for i, person_data in enumerate(input_list):
        row = START_ROW + 1 + i
        employee_row_map[person_data['성명']] = row
        for col, key in enumerate(info_headers, 1):
            ws.cell(row=row, column=col, value=person_data[key])
    
    # 스케줄 랜덤 배치
    work_days_required = {p['성명']: int(p['계약'].replace('주 ', '').replace('회', '')) for p in input_list}
    all_employees = [p['성명'] for p in input_list]
    weekend_shifts_assigned = {name: 0 for name in all_employees}

    weeks = defaultdict(list)
    for day in range(1, num_days + 1):
        date = datetime.date(year, month, day)
        weeks[date.isocalendar()[1]].append(date)

    for week_num, dates_in_week in sorted(weeks.items()):
        work_days_scheduled_this_week = {name: 0 for name in all_employees}
        weekends_in_week = [d for d in dates_in_week if d.weekday() >= 5]
        weekdays_in_week = [d for d in dates_in_week if d.weekday() < 5]
        
        for weekend_date in weekends_in_week:
            col = date_col_start + weekend_date.day - 1
            eligible = [name for name in all_employees if work_days_scheduled_this_week[name] < work_days_required[name]]
            
            if not eligible: continue

            min_shifts = min(weekend_shifts_assigned[name] for name in eligible)
            priority_pool = [name for name in eligible if weekend_shifts_assigned[name] == min_shifts]
            
            random.shuffle(priority_pool)
            
            # 주말 근무 인원수가 부족할 경우, 다음 우선순위 그룹에서 충원
            secondary_pool = [name for name in eligible if weekend_shifts_assigned[name] > min_shifts]
            random.shuffle(secondary_pool)
            
            combined_pool = priority_pool + secondary_pool
            
            scheduled = combined_pool[:WEEKEND_STAFF_COUNT]

            for name in scheduled:
                ws.cell(row=employee_row_map[name], column=col).fill = WORK_FILL
                work_days_scheduled_this_week[name] += 1
                weekend_shifts_assigned[name] += 1

        for weekday_date in weekdays_in_week:
            col = date_col_start + weekday_date.day - 1
            eligible = [name for name in all_employees if work_days_scheduled_this_week[name] < work_days_required[name]]
            num_to_schedule = random.randint(MIN_WEEKDAY_STAFF, MAX_WEEKDAY_STAFF)
            scheduled = random.sample(eligible, min(len(eligible), num_to_schedule))
            for name in scheduled:
                ws.cell(row=employee_row_map[name], column=col).fill = WORK_FILL
                work_days_scheduled_this_week[name] += 1

    # 근무일 카운트
    summary_col_start = date_col_start + num_days
    for i, header in enumerate(summary_headers, 0):
        cell = ws.cell(row=START_ROW, column=summary_col_start + i, value=header)
        cell.fill = HEADER_FILL
        cell.font = BOLD_FONT
        cell.alignment = CENTER_ALIGN
        
    for name, row in employee_row_map.items():
        weekday_count = 0
        weekend_count = 0
        for day in range(1, num_days + 1):
            col = date_col_start + day - 1
            if ws.cell(row=row, column=col).fill.start_color.rgb == WORK_FILL.start_color.rgb:
                if datetime.date(year, month, day).weekday() < 5:
                    weekday_count += 1
                else:
                    weekend_count += 1
        ws.cell(row=row, column=summary_col_start, value=weekday_count).alignment = CENTER_ALIGN
        ws.cell(row=row, column=summary_col_start + 1, value=weekend_count).alignment = CENTER_ALIGN

    # 전체 테두리
    last_row_num = START_ROW + len(input_list)
    for r in ws.iter_rows(min_row=START_ROW, max_row=last_row_num, min_col=1, max_col=last_col_num):
        for cell in r:
            cell.border = TABLE_BORDER
    
    # 파일 저장
    try:
        wb.save(output_filename)
        print(f"✅ 성공! '{output_filename}' 파일이 생성되었습니다.")
    except PermissionError:
        print(f"❌ 실패: '{output_filename}' 파일이 다른 프로그램에서 열려 있습니다. 파일을 닫고 다시 시도해주세요.")

if __name__ == "__main__":
    create_schedule()