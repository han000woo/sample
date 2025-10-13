// 과목 원본 데이터
let subjects = []; 
// 시간표 배치 데이터
let schedule = [];
// 드래그 중인 과목 정보 (임시 저장)
let draggedInfo = null;
function renderSchedule() {
    // 1. 모든 셀 초기화
    document.querySelectorAll('.schedule-cell').forEach(cell => {
        cell.innerHTML = '';
        cell.className = 'schedule-cell'; // 'colored' 등 추가된 클래스 모두 제거
        cell.style.backgroundColor = '';
        cell.style.borderRadius = '';
        cell.style.borderBottomColor = ''; // 테두리 색상 초기화
        cell.draggable = false;
        cell.removeAttribute('data-schedule-id');
        cell.removeEventListener('dragstart', handleDragStart);
        cell.removeEventListener('dragend', handleDragEnd);
    });

    // 2. schedule 배열을 순회하며 과목 셀 스타일링
    schedule.forEach(item => {
        const subject = subjects.find(s => s.id === item.subjectId);
        if (!subject) return;

        const durationSlots = Math.ceil(item.duration / 30);
        const startTimeInMinutes = timeToMinutes(item.startTime);

        for (let i = 0; i < durationSlots; i++) {
            const currentSlotTime = minutesToTime(startTimeInMinutes + i * 30);
            const cell = document.querySelector(`.schedule-cell[data-day='${item.day}'][data-time='${currentSlotTime}']`);

            if (cell) {
                // ✨ [핵심] 공통 스타일 적용
                cell.classList.add('colored');
                cell.style.backgroundColor = subject.color;
                cell.dataset.scheduleId = item.scheduleId;
                cell.draggable = true;
                cell.addEventListener('dragstart', handleDragStart);
                cell.addEventListener('dragend', handleDragEnd);

                // ✨ [핵심] 첫 번째 셀 스타일링
                if (i === 0) {
                    cell.textContent = subject.title;
                    cell.style.borderTopLeftRadius = '6px';
                    cell.style.borderTopRightRadius = '6px';
                }
                
                // ✨ [핵심] 마지막 셀이 아닐 경우, 아래쪽 테두리를 배경색과 동일하게 만들어 숨김
                if (i < durationSlots - 1) {
                    cell.style.borderBottomColor = subject.color;
                }

                // ✨ [핵심] 마지막 셀 스타일링
                if (i === durationSlots - 1) {
                    cell.style.borderBottomLeftRadius = '6px';
                    cell.style.borderBottomRightRadius = '6px';
                }
            }
        }
    });
}
/**
 * ✨ [변경] 이제 이벤트의 대상(e.target)은 .subject-item이 아닌 .schedule-cell 입니다.
 */
function handleDragStart(e) {
    // 셀에 저장된 scheduleId를 통해 드래그 정보 가져오기
    const scheduleId = e.target.dataset.scheduleId;
    const scheduleItem = schedule.find(item => item.scheduleId === scheduleId);
    
    if (scheduleItem) {
        draggedInfo = scheduleItem; // 드래그 시작 시 정보 저장
        e.dataTransfer.setData('text/plain', scheduleId);
        
        // 시각적 효과: 관련된 모든 셀을 반투명하게 만듦
        setTimeout(() => {
            document.querySelectorAll(`[data-schedule-id='${scheduleId}']`).forEach(cell => {
                cell.style.opacity = '1';
            });
        }, 0);
    }
}

function handleDragEnd(e) {
    if (draggedInfo) {
        // 드래그 종료 시 모든 관련 셀의 투명도 복원
        document.querySelectorAll(`[data-schedule-id='${draggedInfo.scheduleId}']`).forEach(cell => {
            cell.style.opacity = '1';
        });
    }
    draggedInfo = null; // 드래그 정보 초기화
    document.querySelectorAll('.schedule-cell').forEach(c => {
        c.classList.remove('drop-allowed', 'drop-forbidden');
    });
}

// --- 충돌 감지 로직 ---

/**
 * ✨ [핵심] 특정 시간 슬롯이 비어있는지 확인하는 함수
 * @param {string} targetDay - 검사할 요일
 * @param {string} targetStartTime - 검사할 시작 시간
 * @param {number} duration - 수업 시간 (분)
 * @param {string} ignoreId - 검사에서 제외할 스케줄 ID (자기 자신)
 * @returns {boolean} - 비어있으면 true, 아니면 false
 */
function isTimeSlotAvailable(targetDay, targetStartTime, duration, ignoreId) {
    const newStart = timeToMinutes(targetStartTime);
    const newEnd = newStart + duration;

    // schedule 배열에서 겹치는 항목이 있는지 검사
    return !schedule.some(item => {
        if (item.scheduleId === ignoreId || item.day !== targetDay) {
            return false; // 자기 자신이거나 요일이 다르면 통과
        }

        const existingStart = timeToMinutes(item.startTime);
        const existingEnd = existingStart + item.duration;
        
        // 시간 겹침 확인: (내 시작 < 상대 끝) AND (내 끝 > 상대 시작)
        return newStart < existingEnd && newEnd > existingStart;
    });
}


// --- 초기화 함수들 ---

function initializeDragAndDrop() {
    const dropZones = document.querySelectorAll('.schedule-cell, #trash-can');

    dropZones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!draggedInfo) return; // 드래그 정보가 없으면 무시

            if (zone.classList.contains('schedule-cell')) {
                const day = zone.dataset.day;
                const time = zone.dataset.time;
                
                // 충돌 검사
                const isAvailable = isTimeSlotAvailable(day, time, draggedInfo.duration, draggedInfo.scheduleId);
                
                if (isAvailable) {
                    zone.classList.add('drop-allowed');
                    zone.classList.remove('drop-forbidden');
                } else {
                    zone.classList.add('drop-forbidden');
                    zone.classList.remove('drop-allowed');
                }
            } else if (zone.id === 'trash-can') {
                zone.classList.add('drag-over');
            }
        });

        zone.addEventListener('dragleave', (e) => {
            if (zone.classList.contains('schedule-cell')) {
                zone.classList.remove('drop-allowed', 'drop-forbidden');
            } else if (zone.id === 'trash-can') {
                zone.classList.remove('drag-over');
            }
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-allowed', 'drop-forbidden', 'drag-over');
            if (!draggedInfo) return;

            // 휴지통에 드롭
            if (zone.id === 'trash-can') {
                schedule = schedule.filter(item => item.scheduleId !== draggedInfo.scheduleId);
            }
            // 시간표 셀에 드롭
            else if (zone.classList.contains('schedule-cell')) {
                const day = zone.dataset.day;
                const time = zone.dataset.time;

                // 드롭 직전에 마지막으로 충돌 검사
                if (isTimeSlotAvailable(day, time, draggedInfo.duration, draggedInfo.scheduleId)) {
                    // 데이터 업데이트
                    const itemToUpdate = schedule.find(item => item.scheduleId === draggedInfo.scheduleId);
                    itemToUpdate.day = day;
                    itemToUpdate.startTime = time;
                }
            }
            renderSchedule(); // 데이터 변경 후 항상 화면 다시 그리기
        });
    });
}

function initializeButtons() {
    const generateBtn = document.getElementById('generate-button');
    
    // 임시로 과목 생성 버튼을 누르면 샘플 데이터가 추가되도록 변경
    generateBtn.addEventListener('click', () => {
        // 샘플 데이터 추가
        subjects = [
            { id: 1, title: '수학', color: '#a2d2ff' },
            { id: 2, title: '영어', color: '#ffc8dd' },
            { id: 3, title: '프로그래밍', color: '#bde0fe' },
        ];
        schedule = [
            { scheduleId: 's1', subjectId: 1, day: '월', startTime: '09:30', duration: 90 },
            { scheduleId: 's2', subjectId: 2, day: '화', startTime: '13:00', duration: 120 },
            { scheduleId: 's3', subjectId: 3, day: '목', startTime: '10:00', duration: 180 },
        ];
        renderSchedule();
    });
}

// --- 유틸리티 함수들 ---

function timeToMinutes(time) { // "HH:MM" -> 분
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}
function minutesToTime(minutes) { // 분 -> "HH:MM"
    const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mins = String(minutes % 60).padStart(2, '0');
    return `${hours}:${mins}`;
}
