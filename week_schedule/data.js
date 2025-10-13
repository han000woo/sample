// 과목 원본 데이터
let subjects = [];
// 시간표 배치 데이터
let schedule = [];
// 드래그 중인 과목 정보 (임시 저장)
let draggedInfo = null;

function renderSchedule() {
    // 1. 모든 셀과 기존 오버레이 초기화
    document.querySelectorAll('.schedule-cell').forEach(cell => {
        cell.innerHTML = '';
        cell.className = 'schedule-cell';
        cell.style.backgroundColor = '';
        cell.style.borderRadius = '';
        cell.style.borderBottomColor = '';
        cell.draggable = false;
        cell.removeAttribute('data-schedule-id');
        cell.removeEventListener('dragstart', handleDragStart);
        cell.removeEventListener('dragend', handleDragEnd);
    });
    // 그리드에 직접 추가된 이전 오버레이들을 모두 제거
    document.querySelectorAll('.subject-title-overlay').forEach(overlay => overlay.remove());

    // 2. schedule 배열을 순회하며 과목 셀 스타일링 및 오버레이 생성
    schedule.forEach(item => {
        const subject = subjects.find(s => s.id === item.subjectId);
        if (!subject) return;

        const durationSlots = Math.ceil(item.duration / 30);
        const startTimeInMinutes = timeToMinutes(item.startTime);

        let firstCell = null; // 오버레이 위치 계산을 위해 첫 번째 셀을 저장할 변수

        for (let i = 0; i < durationSlots; i++) {
            const currentSlotTime = minutesToTime(startTimeInMinutes + i * 30);
            const cell = document.querySelector(`.schedule-cell[data-day='${item.day}'][data-time='${currentSlotTime}']`);

            if (cell) {
                // 셀 스타일링 로직 (이전과 동일)
                cell.classList.add('colored');
                cell.style.backgroundColor = subject.color;
                cell.dataset.scheduleId = item.scheduleId;
                cell.draggable = true;
                cell.addEventListener('dragstart', handleDragStart);
                cell.addEventListener('dragend', handleDragEnd);

                if (i === 0) {
                    firstCell = cell; // 첫 번째 셀 저장
                    cell.style.borderTopLeftRadius = '6px';
                    cell.style.borderTopRightRadius = '6px';
                }
                if (i < durationSlots - 1) {
                    cell.style.borderBottomColor = subject.color;
                }
                if (i === durationSlots - 1) {
                    cell.style.borderBottomLeftRadius = '6px';
                    cell.style.borderBottomRightRadius = '6px';
                }
            }
        }

        // ✨ [핵심] 오버레이 생성 및 그리드에 직접 추가
        if (firstCell) {
            const titleOverlay = document.createElement('div');
            titleOverlay.className = 'subject-title-overlay';
            titleOverlay.textContent = subject.title;

            // 위치와 크기 계산
            titleOverlay.style.top = `${firstCell.offsetTop}px`;
            titleOverlay.style.left = `${firstCell.offsetLeft}px`;
            titleOverlay.style.width = `${firstCell.offsetWidth}px`;
            // 높이는 (셀 높이 * 칸 수) + (칸 사이의 테두리 1px * (칸 수 - 1))
            const totalHeight = durationSlots * firstCell.offsetHeight;
            titleOverlay.style.height = `${totalHeight}px`;

            grid.appendChild(titleOverlay); // 그리드에 직접 추가
        }
    });
}

/**
 * ✨ [변경] 이제 이벤트의 대상(e.target)은 .subject-item이 아닌 .schedule-cell 입니다.
 */
function handleDragStart(e) {
    const scheduleId = e.target.dataset.scheduleId;
    const scheduleItem = schedule.find(item => item.scheduleId === scheduleId);

    if (scheduleItem) {
        draggedInfo = scheduleItem;
        e.dataTransfer.setData('text/plain', scheduleId);
        e.dataTransfer.effectAllowed = 'move';

        // --- ✨ [핵심] 드래그 이미지를 동적으로 생성 ---
        const subject = subjects.find(s => s.id === scheduleItem.subjectId);
        const durationSlots = Math.ceil(scheduleItem.duration / 30);

        // 1. 고스트 요소 생성
        const dragGhost = document.createElement('div');
        dragGhost.className = 'drag-ghost';
        dragGhost.textContent = subject.title;
        dragGhost.style.backgroundColor = subject.color;
        dragGhost.style.width = `${e.target.offsetWidth}px`; // 실제 셀의 너비
        dragGhost.style.height = `${durationSlots * e.target.offsetHeight}px`; // 실제 블록의 높이

        // 2. body에 잠시 추가했다가 setDragImage로 사용
        document.body.appendChild(dragGhost);

        // 3. 생성한 고스트 요소를 드래그 이미지로 설정 (커서 위치는 중앙으로)
        e.dataTransfer.setDragImage(dragGhost, e.target.offsetWidth / 2, 15);

        // --- 드래그하는 원본 요소 스타일 변경 ---
        setTimeout(() => {
            // 4. 사용이 끝난 고스트 요소를 DOM에서 제거
            document.body.removeChild(dragGhost);
        }, 0);
    }
}

function handleDragEnd(e) {
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

    if (newEnd > endH * 60) {
        return false; // 시간표 끝을 넘어가면 배치 불가능
    }

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
    const addSubjectBtn = document.getElementById('add-subject-btn');

    addSubjectBtn.addEventListener('click', () => {
        openModal();
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
