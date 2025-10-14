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
                cell.classList.add('colored');
                cell.style.backgroundColor = subject.color;
                cell.dataset.scheduleId = item.scheduleId; // 드래그 종료 시 opacity 복원을 위해 ID는 남겨둠

                if (i === 0) {
                    firstCell = cell;
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

        if (firstCell) {
            const titleOverlay = document.createElement('div');
            titleOverlay.className = 'subject-title-overlay';
            titleOverlay.textContent = subject.title;

            // --- 이벤트 처리를 위한 속성 추가 ---
            titleOverlay.draggable = true;
            titleOverlay.dataset.scheduleId = item.scheduleId; // 드래그 시 ID 참조용

            // --- 모든 이벤트 리스너를 여기에 추가 ---
            titleOverlay.addEventListener('click', (e) => {
                e.stopPropagation();
                showContextMenu(e.pageX, e.pageY, item.scheduleId);
            });
            titleOverlay.addEventListener('dragstart', handleDragStart);
            titleOverlay.addEventListener('dragend', handleDragEnd);

            // --- 위치/크기 계산 (이전과 동일) ---
            titleOverlay.style.top = `${firstCell.offsetTop}px`;
            titleOverlay.style.left = `${firstCell.offsetLeft}px`;
            titleOverlay.style.width = `${firstCell.offsetWidth}px`;
            titleOverlay.style.height = `${durationSlots * firstCell.offsetHeight}px`;
            titleOverlay.style.borderRadius = '4px';

            grid.appendChild(titleOverlay);
        }
    });
}

function handleDragStart(e) {
    // 드래그할 일정의 정보를 가져오는 부분 (기존과 동일)
    const scheduleId = e.target.dataset.scheduleId;
    const scheduleItem = schedule.find(item => item.scheduleId === scheduleId);

    if (scheduleItem) {
        draggedInfo = scheduleItem;
        e.dataTransfer.setData('text/plain', scheduleId);
        e.dataTransfer.effectAllowed = 'move';

        // --- ✨ [핵심] 귀여운 동그라미 고스트 생성 ---
        const subject = subjects.find(s => s.id === scheduleItem.subjectId);

        // 1. 고스트 요소 생성
        const dragGhost = document.createElement('div');
        dragGhost.className = 'drag-ghost';
        dragGhost.textContent = '🕒'; // 시계 이모지나 ✨, 📌 같은 아이콘을 넣을 수 있습니다.
        dragGhost.style.backgroundColor = subject.color; // 일정의 색상은 그대로 유지합니다.

        // 2. body에 잠시 추가
        document.body.appendChild(dragGhost);

        // 3. 생성한 고스트를 드래그 이미지로 설정합니다.
        //    (커서 위치는 40x40 동그라미의 정중앙인 20, 20으로 설정)
        e.dataTransfer.setDragImage(dragGhost, 20, 20);

        // --- 원본 요소 스타일 변경 및 고스트 제거 (기존과 유사) ---
        setTimeout(() => {
            // 사용이 끝난 고스트 요소를 화면에서 완전히 제거합니다.
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
    const importBtn = document.getElementById('import-btn');
    const fileInput = document.getElementById('file-input');
    const resetBtn = document.getElementById('reset-button');
    const downloadBtn = document.getElementById('download-button');
    const demoDownloadBtn = document.getElementById('demo-download-btn');

    addSubjectBtn.addEventListener('click', () => {
        openModal();
    });


    // '엑셀 불러오기' 버튼을 누르면 숨겨진 파일 선택창이 열립니다.
    importBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // 사용자가 파일을 선택하면 handleExcelImport 함수가 실행됩니다.
    fileInput.addEventListener('change', handleExcelImport);

    resetBtn.addEventListener('click', () => {
        subjects = [];
        schedule = [];
        renderSchedule();
    });

    downloadBtn.addEventListener('click', () => {
        handleImageExport();
    });

    demoDownloadBtn.addEventListener('click', () => {
        handleDownloadDemo();
    })

}

// --- 유틸리티 함수들 ---

function timeToMinutes(time) { // "HH:MM" -> 분
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}
function minutesToTime(minutes) { // 분 -> "HH:MM"
    const hours = String(Math.floor(minutes / 60) % 24).padStart(2, '0');
    const mins = String(minutes % 60).padStart(2, '0');
    return `${hours}:${mins}`;
}
