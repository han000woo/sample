const startH = 8;
const endH = 25;
const grid = document.getElementById('grid');
const timeCol = grid.querySelector('.time-col');

document.addEventListener('DOMContentLoaded', () => {
    // 페이지 로드 시 시간 그리드와 요일 셀 생성
    createTimeGridRows();
    initializeButtons();
    initializeDragAndDrop();
});

// 빈 시간표 틀을 생성하는 함수 (기존과 유사하나 일부 수정)
function createTimeGridRows() {
    grid.innerHTML = `
        <div class="day-header">시간</div><div class="day-header">월</div>
        <div class="day-header">화</div><div class="day-header">수</div>
        <div class="day-header">목</div><div class="day-header">금</div>
        <div class="day-header">토</div><div class="day-header">일</div>
    `;

    for (let h = startH; h < endH; h++) {
        for (let m = 0; m < 60; m += 30) {
            const timeString = `${String(h % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            
            const timeSlot = document.createElement('div');
            timeSlot.classList.add('time-slot');
            if (m === 0) timeSlot.textContent = `${h % 24}:00`;
            else timeSlot.textContent = `${h % 24}:30`;
            grid.appendChild(timeSlot);

            ['월', '화', '수', '목', '금', '토', '일'].forEach(day => {
                const cell = document.createElement('div');
                cell.classList.add('schedule-cell');
                cell.dataset.day = day;
                cell.dataset.time = timeString;
                grid.appendChild(cell);
            });
        }
    }
}