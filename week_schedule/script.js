const startH = 8;
const endH = 25;
const grid = document.getElementById('grid');
const timeCol = grid.querySelector('.time-col');

document.addEventListener('DOMContentLoaded', () => {
    // 페이지 로드 시 시간 그리드와 요일 셀 생성
    createTimeGridRows();
});

function createTimeGridRows() {
    // 👇 #grid를 직접 선택합니다.
    const grid = document.getElementById('grid');

    // 이전에 생성된 시간 슬롯과 스케줄 셀만 삭제합니다 (헤더는 남김).
    const existingDynamicElements = grid.querySelectorAll('.time-slot, .schedule-cell');
    existingDynamicElements.forEach(el => el.remove());

    let currentHour = startH;
    let currentMin = 0;
    const endTimeInMinutes = endH * 60;

    while (currentHour * 60 + currentMin < endTimeInMinutes) {
        let displayHour = currentHour % 24;
        const timeString = `${String(displayHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

        // 1. 시간 칸 생성 및 grid에 직접 추가
        const timeSlot = document.createElement('div');
        timeSlot.classList.add('time-slot');
        timeSlot.dataset.time = timeString;
        if (currentMin === 0) {
            timeSlot.textContent = `${String(displayHour).padStart(2, '0')}:00`;
        }else{
            timeSlot.textContent = `${String(displayHour).padStart(2, '0')}:30`;
        }
        // 👇 grid에 바로 추가
        grid.appendChild(timeSlot);

        // 2. 요일별 셀 생성 및 grid에 직접 추가
        const days = ['월', '화', '수', '목', '금', '토', '일'];
        for (const day of days) {
            const dayCell = document.createElement("div");
            dayCell.classList.add("schedule-cell");
            dayCell.dataset.day = day;
            dayCell.dataset.time = timeString;
            dayCell.addEventListener("click", () => {
                alert(`${day}요일 ${timeString} 클릭됨`);
            });
            // 👇 grid에 바로 추가
            grid.appendChild(dayCell);
        }

        currentMin += 30;
        if (currentMin >= 60) {
            currentMin -= 60;
            currentHour += 1;
        }
    }
}