/* ========================================================== */
/* 1. 전역 변수 및 상수 */
/* ========================================================== */
const grid = document.getElementById('grid');
const startH = 8; // 그리드 시작 시간 (오전 8시)
const endH = 25;  // 그리드 종료 시간 (다음 날 새벽 1시)

let subjects = []; // { id, title, color }
let schedule = []; // { scheduleId, subjectId, day, startTime, duration, isAutoPlaced }
let batchTasks = []
let priorityMinutes = { A: 600, B: 480, C: 360, D: 240, E: 120 }
let draggedInfo = null;
let currentContextMenu = { scheduleId: null, target: null };

let clipboard = null;
let currentEmptyCellMenu = { target: null, day: null, time: null };

// ▼▼▼ [신규] 리사이즈 상태 변수 ▼▼▼
let isResizing = false;
let resizeInfo = {
    scheduleId: null,
    startY: 0,          // 마우스 시작 Y 좌표
    originalHeight: 0,  // 원래 오버레이 높이
    cellHeight: 0,      // 셀 1칸(30분)의 픽셀 높이
};
// 리사이즈 중 mousemove 이벤트를 스로틀(throttle)할 핸들러
let throttledResizeHandler = null;

const LS_COLORS_KEY = 'scheduleUsedColors';
let usedColors = ['#3498db', '#e74c3c', '#f39c12', '#2ecc71', '#9b59b6', '#1abc9c']; // 기본 색상

/* ========================================================== */
/* 2. 초기화 함수 (페이지 로딩 시) */
/* ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
    loadUsedColors();
    createTimeGridRows();
    initializeButtons();
    initializeModal();
    initializeBatchContainer();
    initializeTitleEditor();
    initializeThemeModal();
    initializeSidebarToggle();
    initializeBatchEditModal();

    // 1. (기존) 창 크기를 조절하는 '동안' 부드럽게 렌더링
    const throttledRender = throttle(renderSchedule, 150);
    window.addEventListener('resize', throttledRender);

    // ▼▼▼ [신규] 이 코드를 추가하세요 ▼▼▼

    // 2. (신규) '1200px 경계선'을 넘을 때 즉시 렌더링 (레이아웃 보정용)
    //    CSS 미디어 쿼리 상태가 '변경'될 때 1회만 즉시 실행됩니다.
    const mediaQuery = window.matchMedia('(max-width: 1200px)');

    mediaQuery.addEventListener('change', () => {
        // 레이아웃이 (사이드바가 나타나거나 사라지면서) 급격히 변경된
        // 직후이므로, 딜레이 없이 즉시 렌더링을 다시 실행합니다.
        renderSchedule();
    });

    throttledResizeHandler = throttle(handleResizing, 50);

    renderSchedule();
});

/** 그리드의 시간 행과 빈 셀들을 생성합니다. */
function createTimeGridRows() {
    for (let h = startH; h < endH; h++) {
        for (let m = 0; m < 60; m += 30) {
            const time = `${String(h % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

            // 시간 레이블
            const timeLabel = document.createElement('div');
            timeLabel.className = 'time-label';
            timeLabel.textContent = time;
            grid.appendChild(timeLabel);

            // 요일별 빈 셀
            ['월', '화', '수', '목', '금', '토', '일'].forEach(day => {
                const cell = document.createElement('div');
                cell.className = 'schedule-cell';
                cell.dataset.day = day;
                cell.dataset.time = time;
                grid.appendChild(cell);
            });
        }
    }
}

/** 모든 버튼의 이벤트 리스너를 초기화합니다. */
function initializeButtons() {


    // 엑셀 양식 다운로드
    const demoDownloadBtn = document.getElementById('demo-download-btn');
    if (demoDownloadBtn) demoDownloadBtn.addEventListener('click', handleDownloadDemo);

    // 엑셀 불러오기 (파일 선택창 열기)
    const importBtn = document.getElementById('import-btn');
    const fileInput = document.getElementById('file-input');
    if (importBtn) importBtn.addEventListener('click', () => fileInput.click());
    if (fileInput) fileInput.addEventListener('change', handleExcelImport);

    // 새 일정 추가 (모달 열기)
    const addBtn = document.getElementById('add-subject-btn');
    if (addBtn) addBtn.addEventListener('click', () => openModal());

    // 이미지로 저장
    const downloadBtn = document.getElementById('download-button');
    if (downloadBtn) downloadBtn.addEventListener('click', handleImageExport);

    // 초기화
    const resetBtn = document.getElementById('reset-button');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('정말 모든 일정을 초기화하시겠습니까? 되돌릴 수 없습니다.')) {
                subjects = [];
                schedule = [];
                renderSchedule();
            }
        });
    }

    const themeBtn = document.getElementById('theme-settings-btn');
    if (themeBtn) themeBtn.addEventListener('click', openThemeModal);
}

/** 메인 모달창의 이벤트 리스너를 초기화합니다. */
function initializeModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const subjectForm = document.getElementById('subject-form');

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    modalCloseBtn.addEventListener('click', closeModal);
    subjectForm.addEventListener('submit', handleFormSubmit);

    // 시작 시간/요일 변경 시 '공부 시간' 옵션 동적 업데이트
    document.getElementById('subject-day').addEventListener('change', () => updateDurationOptions());
    document.getElementById('subject-start-time').addEventListener('change', () => updateDurationOptions());
}
function initializeBatchContainer() {
    document.getElementById('batch-form').addEventListener('submit', handleAddTask);
    document.getElementById('batch-place-btn').addEventListener('click', handleBatchPlace);

    // ✨ 중요도 설정 접기/펴기 토글 이벤트
    document.getElementById('priority-toggle').addEventListener('click', () => {
        document.getElementById('priority-settings').classList.toggle('is-collapsed');
    });

    const priorities = ['A', 'B', 'C', 'D', 'E'];

    priorities.forEach(prio => {
        const hSelect = document.getElementById(`prio-${prio}-h`);
        const mSelect = document.getElementById(`prio-${prio}-m`);

        if (!hSelect || !mSelect) return; // HTML이 없으면 중단

        // 1. 시간(hour) 드롭다운 채우기 (0 ~ 10시간)
        for (let i = 0; i <= 10; i++) {
            if (hSelect) hSelect.add(new Option(i, i));
        }

        // 2. priorityMinutes 데이터로 드롭다운 초기값 설정
        const totalMins = priorityMinutes[prio] || 0; // [수정] || 0 추가
        const hours = Math.floor(totalMins / 60);
        const mins = totalMins % 60;

        hSelect.value = hours;
        mSelect.value = (mins >= 30) ? 30 : 0;

        // 3. select에 이벤트 리스너 추가
        const updatePriority = () => {
            const h = parseInt(hSelect.value) || 0;
            const m = parseInt(mSelect.value) || 0;
            priorityMinutes[prio] = (h * 60) + m;
        };

        hSelect.addEventListener('change', updatePriority);
        mSelect.addEventListener('change', updatePriority);
    });

    // 4. 페이지 로드 시 빈 목록을 렌더링합니다.
    renderBatchList();
}
/* ========================================================== */
/* 3. 메인 시간표 렌더링 및 조작 */
/* ========================================================== */

/** schedule 데이터를 기반으로 시간표 UI를 다시 그립니다. */
function renderSchedule() {
    // 1. 모든 셀과 오버레이 초기화
    document.querySelectorAll('.schedule-cell').forEach(cell => {
        cell.innerHTML = '';
        cell.className = 'schedule-cell';
        cell.style.backgroundColor = '';
        cell.style.borderRadius = '';
        cell.style.borderBottomColor = '';
    });
    document.querySelectorAll('.subject-title-overlay').forEach(overlay => overlay.remove());

    // 2. schedule 배열 순회하며 그리기
    schedule.forEach(item => {
        const subject = subjects.find(s => s.id === item.subjectId);
        if (!subject) return;

        const startTimeInMinutes = timeToMinutes(item.startTime);
        const durationSlots = item.duration / 30;
        let firstCell = null;

        for (let i = 0; i < durationSlots; i++) {
            const cellTime = minutesToTime(startTimeInMinutes + i * 30);
            const cellSelector = `.schedule-cell[data-day='${item.day}'][data-time='${cellTime}']`;
            const cell = grid.querySelector(cellSelector);

            if (cell) {
                cell.classList.add('colored');
                cell.style.backgroundColor = subject.color;
                cell.dataset.scheduleId = item.scheduleId;

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

        // 3. 오버레이(일정 제목) 추가
        if (firstCell) {
            const titleOverlay = document.createElement('div');
            // const titleText = document.createElement('span');

            titleOverlay.className = 'subject-title-overlay';
            titleOverlay.textContent = subject.title;

            const today = new Date();
            const currentDayOfWeek = (today.getDay() + 6) % 7; // 0=월, 6=일

            // 이번 주 월요일 00:00:00
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - currentDayOfWeek);
            weekStart.setHours(0, 0, 0, 0);

            // 이번 주 일요일 23:59:59
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            titleOverlay.style.backgroundColor = subject.color; // 오버레이에도 배경색 적용

            if (item.dueDate && isDateInCurrentWeek(item.dueDate, weekStart, weekEnd)) {
                try {
                    // YYYY-MM-DD 형식에서 월/일만 추출
                    const date = new Date(item.dueDate + 'T00:00:00'); // 시간대 문제 방지
                    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;

                    const dueDateEl = document.createElement('div');
                    dueDateEl.className = 'overlay-due-date';
                    dueDateEl.textContent = `🔥 마감: ${formattedDate}`;
                    titleOverlay.appendChild(dueDateEl);
                } catch (e) {
                    console.error("Invalid due date in schedule item:", item.dueDate);
                }
            }
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'resize-handle';
            // 핸들에 "ns-resize" (상하) 커서를 표시
            resizeHandle.innerHTML = '<span class="material-icons">drag_handle</span>';

            // 리사이즈 시작 이벤트 연결
            resizeHandle.addEventListener('mousedown', (e) => {
                // 부모(overlay)의 '이동' 드래그가 실행되지 않도록 막음
                e.stopPropagation();
                handleResizeStart(e, item.scheduleId);
            });
            titleOverlay.appendChild(resizeHandle);

            titleOverlay.draggable = true;
            titleOverlay.dataset.scheduleId = item.scheduleId;
            titleOverlay.addEventListener('click', (e) => {
                e.stopPropagation();
                showContextMenu(e.pageX, e.pageY, item.scheduleId);
            });
            titleOverlay.addEventListener('dragstart', handleDragStart);
            titleOverlay.addEventListener('dragend', handleDragEnd);

            // 위치/크기 계산
            const padding = 8;
            titleOverlay.style.top = `${firstCell.offsetTop}px`;
            titleOverlay.style.left = `${firstCell.offsetLeft + (padding / 2)}px`;
            titleOverlay.style.width = `${firstCell.offsetWidth - padding}px`;
            titleOverlay.style.height = `${durationSlots * firstCell.offsetHeight}px`;
            titleOverlay.style.borderRadius = '4px';

            grid.appendChild(titleOverlay);
        }
    });

    // 4. 빈 셀에도 이벤트 리스너 추가
    grid.querySelectorAll('.schedule-cell:not(.colored)').forEach(cell => {
        cell.addEventListener('click', (e) => {
            openModal({ day: e.target.dataset.day, startTime: e.target.dataset.time });
        });

        cell.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // 기본 브라우저 메뉴 차단

            // 클립보드에 복사된 내용이 있을 때만 메뉴를 보여줌
            if (clipboard) {
                showEmptyCellContextMenu(e.pageX, e.pageY, e.target.dataset.day, e.target.dataset.time);
            }
        });

        // 👇 [수정] 드래그 이벤트 리스너 추가
        cell.addEventListener('dragover', handleDragOver);
        cell.addEventListener('dragleave', clearDragHighlights); // ✨ [추가]
        cell.addEventListener('drop', handleDrop);
    });


}

/** 컨텍스트 메뉴(우클릭 메뉴)를 엽니다. */
function showContextMenu(x, y, scheduleId) {
    hideAllContextMenus(); // 기존 메뉴 숨기기
    const menu = document.getElementById('context-menu');
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.classList.remove('hidden');
    currentContextMenu.scheduleId = scheduleId;
    currentContextMenu.target = menu;

    document.getElementById('context-edit').onclick = () => handleEdit(scheduleId);
    document.getElementById('context-copy').onclick = () => handleCopy(scheduleId);
    document.getElementById('context-delete').onclick = () => handleDelete(scheduleId);

    setTimeout(() => {
        window.addEventListener('click', hideContextMenu, { once: true });
    }, 0);
}

/** 컨텍스트 메뉴를 닫습니다. */
function hideContextMenu() {
    if (currentContextMenu.target) {
        currentContextMenu.target.classList.add('hidden');
        currentContextMenu.target = null;
        currentContextMenu.scheduleId = null;
    }
}

function hideEmptyCellContextMenu() {
    if (currentEmptyCellMenu.target) {
        currentEmptyCellMenu.target.classList.add('hidden');
        currentEmptyCellMenu.target = null;
        currentEmptyCellMenu.day = null;
        currentEmptyCellMenu.time = null;
    }
}

function hideAllContextMenus() {
    hideContextMenu();
    hideEmptyCellContextMenu();
}

/** 일정 수정 (모달 열기) */
function handleEdit(scheduleId) {
    const item = schedule.find(s => s.scheduleId === scheduleId);
    const subject = subjects.find(s => s.id === item.subjectId);
    openModal({
        scheduleId: item.scheduleId,
        title: subject.title,
        day: item.day,
        startTime: item.startTime,
        duration: item.duration,
        color: subject.color,
    });
}

/** 일정 삭제 */
function handleDelete(scheduleId) {
    if (confirm('정말로 이 일정을 삭제하시겠습니까?')) {
        schedule = schedule.filter(item => item.scheduleId !== scheduleId);
        renderSchedule();
    }
}


/* ========================================================== */
/* 4. 드래그 앤 드롭 기능 */
/* ========================================================== */

function handleDragStart(e) {
    const scheduleId = e.target.dataset.scheduleId;
    const scheduleItem = schedule.find(item => item.scheduleId === scheduleId);

    if (scheduleItem) {
        draggedInfo = scheduleItem;
        e.dataTransfer.setData('text/plain', scheduleId);
        e.dataTransfer.effectAllowed = 'move';

        const subject = subjects.find(s => s.id === scheduleItem.subjectId);

        const dragGhost = document.createElement('div');
        dragGhost.className = 'drag-ghost';
        dragGhost.textContent = '🕒';
        dragGhost.style.backgroundColor = subject.color;
        document.body.appendChild(dragGhost);
        e.dataTransfer.setDragImage(dragGhost, 20, 20);

        setTimeout(() => {
            document.querySelectorAll(`[data-schedule-id='${scheduleId}']`).forEach(cell => {
                // cell.style.opacity = '0.5';
            });
            document.body.removeChild(dragGhost);
        }, 0);
    }
}

function handleDragEnd(e) {
    clearDragHighlights(); // ✨ [추가] 드래그 종료 시 하이라이트 제거
    document.querySelectorAll(`[data-schedule-id='${draggedInfo.scheduleId}']`).forEach(cell => {
        cell.style.opacity = '1';
    });
    draggedInfo = null;
    renderSchedule(); // 드롭이 성공했든 안했든 UI 복구
}

function handleDragOver(e) {
    e.preventDefault();
    const cell = e.target.closest('.schedule-cell');
    if (!cell || !draggedInfo) return;

    // ✨ [수정] 계속해서 하이라이트를 계산하고 표시
    clearDragHighlights(); // 일단 모두 지우고
    const isValid = isTimeSlotAvailable(cell.dataset.day, cell.dataset.time, draggedInfo.duration, draggedInfo.scheduleId);

    // 이 일정에 해당하는 모든 셀을 찾아 하이라이트
    const cellsToHighlight = getCellsForEvent(cell.dataset.day, cell.dataset.time, draggedInfo.duration);
    cellsToHighlight.forEach(c => {
        c.classList.add(isValid ? 'drag-over-valid' : 'drag-over-invalid');
    });
}

function handleDrop(e) {
    e.preventDefault();
    clearDragHighlights(); // ✨ [추가] 드롭 시 하이라이트 제거
    const cell = e.target.closest('.schedule-cell');
    if (!cell || !draggedInfo) return;

    const newDay = cell.dataset.day;
    const newStartTime = cell.dataset.time;

    if (isTimeSlotAvailable(newDay, newStartTime, draggedInfo.duration, draggedInfo.scheduleId)) {
        draggedInfo.day = newDay;
        draggedInfo.startTime = newStartTime;
    }
}


/** [신규] 드래그 하이라이트를 모두 제거하는 헬퍼 함수 */
function clearDragHighlights() {
    document.querySelectorAll('.drag-over-valid, .drag-over-invalid').forEach(c => {
        c.classList.remove('drag-over-valid', 'drag-over-invalid');
    });
}

/** [신규] 특정 일정에 해당하는 모든 셀을 반환하는 헬퍼 함수 */
function getCellsForEvent(day, startTime, duration) {
    const cells = [];
    const startTimeInMinutes = timeToMinutes(startTime);
    const durationSlots = duration / 30;

    for (let i = 0; i < durationSlots; i++) {
        const cellTime = minutesToTime(startTimeInMinutes + i * 30);
        const cellSelector = `.schedule-cell[data-day='${day}'][data-time='${cellTime}']`;
        const cell = grid.querySelector(cellSelector);
        if (cell) {
            cells.push(cell);
        }
    }
    return cells;
}
/* ========================================================== */
/* 5. 메인 모달 기능 (일정 추가/수정) */
/* ========================================================== */

/** 모달을 열고 폼을 채웁니다. */
function openModal(data = {}) {
    const subjectForm = document.getElementById('subject-form');
    subjectForm.reset();
    populateTimeOptions();

    const modalTitle = document.querySelector('#modal-content h2');
    const editingIdInput = document.getElementById('editing-schedule-id');

    if (data.scheduleId) { // 수정 모드
        modalTitle.textContent = '일정 수정';
        editingIdInput.value = data.scheduleId;
        subjectForm['subject-title'].value = data.title;
        subjectForm['subject-day'].value = data.day;
        subjectForm['subject-start-time'].value = data.startTime;
        subjectForm['subject-color'].value = data.color;

        updateDurationOptions(data.scheduleId);
        subjectForm['subject-duration'].value = data.duration;
    } else { // 추가 모드
        modalTitle.textContent = '새 일정 추가';
        editingIdInput.value = '';
        if (data.day) subjectForm['subject-day'].value = data.day;
        if (data.startTime) subjectForm['subject-start-time'].value = data.startTime;
        updateDurationOptions();
    }
    renderRecentColorsPalette();

    document.getElementById('modal-overlay').classList.remove('hidden');
}

/** 모달을 닫습니다. */
function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
}

/** 모달 폼 제출을 처리합니다. */
function handleFormSubmit(e) {
    e.preventDefault();
    const title = e.target['subject-title'].value;
    const day = e.target['subject-day'].value;
    const startTime = e.target['subject-start-time'].value;
    const duration = parseInt(e.target['subject-duration'].value);
    const color = e.target['subject-color'].value;
    const editingId = e.target['editing-schedule-id'].value;

    if (!title || !duration) {
        alert('일정명과 시간을 올바르게 입력해주세요.');
        return;
    }

    if (!isTimeSlotAvailable(day, startTime, duration, editingId || null)) {
        alert('해당 시간에 이미 다른 일정이 있습니다. 시간을 다시 확인해주세요.');
        return;
    }

    let subject = subjects.find(s => s.title.toLowerCase() === title.toLowerCase());
    if (!subject) {
        subject = { id: Date.now(), title: title, color: color };
        subjects.push(subject);
    } else {
        subject.color = color;
    }

    if (editingId) { // 수정
        const item = schedule.find(s => s.scheduleId === editingId);
        item.subjectId = subject.id;
        item.day = day;
        item.startTime = startTime;
        item.duration = duration;
    } else { // 추가
        schedule.push({
            scheduleId: 's' + Date.now(),
            subjectId: subject.id,
            day: day,
            startTime: startTime,
            duration: duration,
            isAutoPlaced: false,
        });
    }

    addUsedColor(color);

    renderSchedule();
    closeModal();
}

/** 모달의 시간/요일 드롭다운을 채웁니다. */
function populateTimeOptions() {
    const daySelect = document.getElementById('subject-day');
    const timeSelect = document.getElementById('subject-start-time');
    daySelect.innerHTML = '';
    timeSelect.innerHTML = '';

    ['월', '화', '수', '목', '금', '토', '일'].forEach(day => {
        daySelect.add(new Option(day, day));
    });

    for (let h = startH; h < endH; h++) {
        for (let m = 0; m < 60; m += 30) {
            const time = `${String(h % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            timeSelect.add(new Option(time, time));
        }
    }
}

/** 모달의 '공부 시간' 드롭다운을 동적으로 업데이트합니다. (무한 루프 버그 수정됨) */
function updateDurationOptions(ignoreId = null) {
    const subjectForm = document.getElementById('subject-form');
    const day = subjectForm['subject-day'].value;
    const startTime = subjectForm['subject-start-time'].value;
    const durationSelect = subjectForm['subject-duration'];
    durationSelect.innerHTML = '';

    let maxDuration = 0;
    let available = true;
    const startTimeInMinutes = timeToMinutes(startTime);

    while (available) {
        // [버그 수정] 시간표의 끝을 넘어가면 루프 강제 종료
        if (startTimeInMinutes + maxDuration >= endH * 60) {
            available = false;
            continue;
        }

        const nextTime = minutesToTime(startTimeInMinutes + maxDuration);

        if (isTimeSlotAvailable(day, nextTime, 30, ignoreId)) {
            maxDuration += 30;
        } else {
            available = false;
        }
    }

    for (let min = 30; min <= maxDuration; min += 30) {
        const option = document.createElement('option');
        option.value = min;
        const hours = Math.floor(min / 60);
        const mins = min % 60;
        option.textContent = `${hours > 0 ? `${hours}시간` : ''} ${mins > 0 ? `${mins}분` : ''}`.trim();
        durationSelect.appendChild(option);
    }

    if (durationSelect.options.length === 0) {
        const option = document.createElement('option');
        option.textContent = ignoreId ? '시간을 늘릴 수 없습니다' : '추가할 수 있는 시간이 없습니다';
        option.disabled = true;
        durationSelect.appendChild(option);
    }
}


/* ========================================================== */
/* 6. 자동 배치 사이드바 기능 (CRUD 및 배치) */
/* ========================================================== */
/* ▼▼▼ [교체] handleAddTask 함수 ▼▼▼ */
/** (Create) 배치 목록에 새 일정을 추가합니다. (✨ '주간 총 시간' 로직으로 복원) */
function handleAddTask(e) {
    e.preventDefault();
    const titleInput = document.getElementById('task-title');
    const prioritySelect = document.getElementById('task-priority');
    const dueDateInput = document.getElementById('task-due-date');

    const title = titleInput.value;
    const priority = prioritySelect.value;
    const dueDate = dueDateInput.value || null;

    if (title) {
        batchTasks.push({
            id: 't' + Date.now(),
            title: title,
            priority: priority,
            dueDate: dueDate
            // scheduleRule 제거됨
        });

        renderBatchList();
        e.target.reset(); // 폼 리셋
        prioritySelect.value = 'C'; // 기본값 복원
    }
}
/* ▼▼▼ [교체] renderBatchList 함수 ▼▼▼ */
/** (Read) 배치 목록을 화면에 다시 그립니다. (✨ '주간 총 시간' 로직으로 복원) */
function renderBatchList() {
    const listContainer = document.getElementById('batch-list');
    listContainer.innerHTML = '';
    const sortedTasks = [...batchTasks].sort((a, b) => a.priority.localeCompare(b.priority));

    sortedTasks.forEach(task => {
        const item = document.createElement('div');
        item.className = 'task-item';
        item.dataset.id = task.id;

        let dueDateHtml = '';
        if (task.dueDate) {
            try {
                const date = new Date(task.dueDate + 'T00:00:00');
                const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
                dueDateHtml = `<span class="task-due-date">마감: ${formattedDate}</span>`;
            } catch (e) { console.error("Invalid date format:", task.dueDate); }
        }
        
        // HTML 구조 (단순화)
        item.innerHTML = `
            <div class="task-info">
                <span class="priority-badge prio-${task.priority}">${task.priority}</span>
                <div class="task-details">
                    <span class="task-title">${task.title}</span>
                                        ${dueDateHtml}
                </div>
            </div>
            <div class="task-actions">
                <button class="edit-task" title="수정"><span class="material-icons">edit</span></button>
                <button class="delete-task" title="삭제"><span class="material-icons">delete</span></button>
            </div>
        `;
        listContainer.appendChild(item);
    });

    document.querySelectorAll('.edit-task').forEach(btn => btn.addEventListener('click', handleEditTask));
    document.querySelectorAll('.delete-task').forEach(btn => btn.addEventListener('click', handleDeleteTask));
}
/* ▲▲▲ [교체] 여기까지 ▲▲▲ */

/** (Update) 배치 목록의 일정을 수정합니다. */
function handleEditTask(e) {
    const taskId = e.target.closest('.task-item').dataset.id;
    const task = batchTasks.find(t => t.id === taskId);

    if (task) {
        // 기존 prompt 대신 모달을 엽니다.
        openBatchEditModal(task);
    }
}
/** (Delete) 배치 목록의 일정을 삭제합니다. */
function handleDeleteTask(e) {
    const taskId = e.target.closest('.task-item').dataset.id;
    if (confirm('목록에서 이 일정을 삭제하시겠습니까?')) {
        batchTasks = batchTasks.filter(t => t.id !== taskId);
        renderBatchList();
    }
}

/* ▼▼▼ [교체] handleBatchPlace 함수 (헬퍼 함수 삭제) ▼▼▼ */
/** '자동 배치' 버튼을 눌렀을 때 실행되는 메인 함수 (✨ '주간 총 시간' 로직으로 복원) */
function handleBatchPlace() {
    // 1. 기존 자동 배치 일정 제거
    schedule = schedule.filter(item => !item.isAutoPlaced);

    // 2. 중요도별 목표 시간에 따라 일정 조각(chunk) 생성
    const chunks = [];
    batchTasks.forEach(task => {
        // [복원] priorityMinutes에서 총 시간을 가져옴
        const totalDuration = priorityMinutes[task.priority] || 0;
        let remaining = totalDuration;
        while (remaining > 0) {
            const chunkSize = Math.min(remaining, 120); // 최대 2시간(120분) 단위로 자르기
            chunks.push({
                title: task.title,
                duration: chunkSize,
                priority: task.priority,
                dueDate: task.dueDate || null
            });
            remaining -= chunkSize;
        }
    });

    // 3. 중요도(A가 먼저) > 시간 길이(긴 것 먼저) 순으로 정렬
    chunks.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority.localeCompare(b.priority);
        return b.duration - a.duration;
    });

    // 4. 평일의 빈 시간 슬롯 찾기
    const weekdays = ['월', '화', '수', '목', '금'];
    const availableSlots = [];
    for (const day of weekdays) {
        for (let h = startH; h < endH; h++) {
            for (let m = 0; m < 60; m += 30) {
                const time = `${String(h % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                if (isTimeSlotAvailable(day, time, 30, null)) {
                    availableSlots.push({ day, startTime: time });
                }
            }
        }
    }

    shuffleArray(availableSlots); // 빈 슬롯 섞기

    // 5. 정렬된 청크를 빈 슬롯에 배치
    chunks.forEach(chunk => {
        let placed = false;
        for (let i = 0; i < availableSlots.length; i++) {
            const slot = availableSlots[i];
            if (isTimeSlotAvailable(slot.day, slot.startTime, chunk.duration, null)) {
                placeChunk(chunk, slot.day, slot.startTime, chunk.duration); // [수정] duration 전달

                // 사용된 슬롯은 availableSlots에서 제거
                const startMin = timeToMinutes(slot.startTime);
                const endMin = startMin + chunk.duration;
                for (let t = startMin; t < endMin; t += 30) {
                    const timeToRemove = minutesToTime(t);
                    const indexToRemove = availableSlots.findIndex(s => s.day === slot.day && s.startTime === timeToRemove);
                    if (indexToRemove !== -1) availableSlots.splice(indexToRemove, 1);
                }
                placed = true;
                break;
            }
        }
    });

    renderSchedule();
}
/* ▼▼▼ [교체] placeChunk 함수 ▼▼▼ */
/** 일정 조각을 시간표에 실제로 배치하는 헬퍼 함수 (✨ '주간 총 시간' 로직으로 복원) */
function placeChunk(chunk, day, startTime, duration) {
    let subject = subjects.find(s => s.title === chunk.title);
    if (!subject) {
        subject = {
            id: Date.now() + subjects.length,
            title: chunk.title,
            color: getPriorityColor(chunk.priority), // [복원] priority 사용
        };
        subjects.push(subject);
    }
    schedule.push({
        scheduleId: 'auto' + Date.now() + Math.random(),
        subjectId: subject.id,
        day, startTime,
        duration: duration, // [복원] 파라미터 사용
        isAutoPlaced: true,
        dueDate: chunk.dueDate || null // [복원] dueDate 사용
    });
}
/* ▲▲▲ [교체] 여기까지 ▲▲▲ */
/* ========================================================== */
/* 7. 가져오기 / 내보내기 기능 */
/* ========================================================== */

/** 엑셀 양식 파일을 다운로드합니다. */
function handleDownloadDemo() {
    // ▼▼▼ [수정] pywebview API 호출 로직 ▼▼▼
    if (window.pywebview && window.pywebview.api) {
        // --- 1. PyWebview 환경일 때 ---
        // Python의 save_excel_demo() 함수 호출
        window.pywebview.api.save_excel_demo();

    } else {
        // --- 2. 일반 브라우저 환경일 때 (기존 로직) ---
        const link = document.createElement('a');
        link.href = 'data/demo.xlsx'; // 'data' 폴더에 'demo.xlsx' 파일이 있어야 함
        link.download = '일정_입력_양식.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

/** 엑셀 파일을 읽고 파싱하여 시간표를 업데이트합니다. */
function handleExcelImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

        subjects = [];
        schedule = [];
        try {
            parseScheduleData(jsonData, worksheet); // 셀 병합 정보까지 전달
            renderSchedule();
        } catch (error) {
            console.error("엑셀 파일 처리 중 오류 발생:", error);
            alert("엑셀 파일의 형식이 올바르지 않거나 데이터를 처리하는 중 오류가 발생했습니다.");
        }
    };
    reader.onerror = () => alert('파일을 읽는 데 실패했습니다.');
    reader.readAsArrayBuffer(file);
    event.target.value = '';
}

/** 엑셀 데이터를 파싱하여 schedule 배열을 채웁니다. (셀 병합 정보 활용) */
function parseScheduleData(data, worksheet) {
    const headerRowIndex = data.findIndex(row => row && row.includes('월요일'));
    if (headerRowIndex === -1) throw new Error("요일 헤더(월요일, 화요일...)를 찾을 수 없습니다.");

    const header = data[headerRowIndex];
    const dayMapping = { '월요일': '월', '화요일': '화', '수요일': '수', '목요일': '목', '금요일': '금', '토요일': '토', '일요일': '일' };
    const newSubjects = new Map();
    const merges = worksheet['!merges'] || [];
    const processedCells = Array(data.length).fill(0).map(() => Array(header.length).fill(false));

    // [신규] 빈 셀에 사용할 기본값
    const DEFAULT_EMPTY_TITLE = "미지정";
    const DEFAULT_EMPTY_COLOR = "#BDBDBD"; // 회색

    // 1. 병합된 셀 처리
    merges.forEach(merge => {
        const startRow = merge.s.r;
        const startCol = merge.s.c;
        const endRow = merge.e.r;
        if (startRow <= headerRowIndex) return;

        const day = dayMapping[header[startCol]];

        // [수정] 'title' 체크를 'day' 체크로 변경
        if (day) {
            // [수정] title이 없으면(null, "") DEFAULT_EMPTY_TITLE을 사용
            let title = (data[startRow][startCol] || DEFAULT_EMPTY_TITLE).trim();

            const startTime = convertExcelTime(data[startRow][0]);
            const duration = (endRow - startRow + 1) * 30;

            let subject = newSubjects.get(title);
            if (!subject) {
                // [수정] 빈 셀일 경우 기본 색상, 아니면 랜덤 색상
                const color = (title === DEFAULT_EMPTY_TITLE) ? DEFAULT_EMPTY_COLOR : getRandomColor();
                subject = { id: Date.now() + newSubjects.size, title, color: color };
                newSubjects.set(title, subject);
            }

            schedule.push({
                scheduleId: `s${Date.now()}${startRow}${startCol}`,
                subjectId: subject.id,
                day,
                startTime,
                duration,
                isAutoPlaced: false
            });

            for (let r = startRow; r <= endRow; r++) {
                processedCells[r][startCol] = true;
            }
        }
    });

    // 2. 병합되지 않은 일반 셀 처리
    for (let r = headerRowIndex + 1; r < data.length; r++) {
        for (let c = 1; c < header.length; c++) {
            if (processedCells[r][c]) continue; // 이미 병합 셀로 처리됨

            const day = dayMapping[header[c]];

            // [수정] 'title' 체크를 'day' 체크로 변경
            if (day) {
                // [수정] title이 없으면(null, "") DEFAULT_EMPTY_TITLE을 사용
                let title = (data[r][c] || DEFAULT_EMPTY_TITLE).trim();

                // [신규] 제목이 "미지정"인 경우 굳이 추가하지 않음 (선택적)
                // 만약 글씨가 없는 30분짜리 모든 칸을 추가하고 싶다면 이 if문을 제거하세요.
                if (title === DEFAULT_EMPTY_TITLE) continue;

                const startTime = convertExcelTime(data[r][0]);

                let subject = newSubjects.get(title);
                if (!subject) {
                    const color = (title === DEFAULT_EMPTY_TITLE) ? DEFAULT_EMPTY_COLOR : getRandomColor();
                    subject = { id: Date.now() + newSubjects.size, title, color: color };
                    newSubjects.set(title, subject);
                }

                schedule.push({
                    scheduleId: `s${Date.now()}${r}${c}`,
                    subjectId: subject.id,
                    day,
                    startTime,
                    duration: 30,
                    isAutoPlaced: false
                });
            }
        }
    }
    subjects = Array.from(newSubjects.values());
}
/** 엑셀 시간 숫자(소수)를 "HH:MM" 문자열로 변환합니다. */
function convertExcelTime(excelTime) {
    if (excelTime === null || isNaN(excelTime)) return "00:00";
    const totalMinutes = Math.round(excelTime * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const roundedMinutes = minutes < 30 ? 0 : 30;
    return `${String(hours % 24).padStart(2, '0')}:${String(roundedMinutes).padStart(2, '0')}`;
}

/** 화면의 시간표를 이미지로 캡처하여 다운로드합니다. (버그 수정됨) */
async function handleImageExport() {
    const captureArea = document.querySelector('.main-container');
    const loadingMessage = document.createElement('div');
    loadingMessage.textContent = '이미지 생성 중... 잠시만 기다려주세요.';
    loadingMessage.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        padding: 20px 40px; background-color: rgba(0,0,0,0.7); color: white;
        border-radius: 10px; z-index: 9999;
    `;
    document.body.appendChild(loadingMessage);

    try {
        const canvas = await html2canvas(captureArea, {
            allowTaint: true,
            useCORS: true,
            logging: false,
            scale: window.devicePixelRatio,
            scrollX: -window.scrollX,
            scrollY: -window.scrollY,
            windowWidth: document.documentElement.offsetWidth,
            windowHeight: document.documentElement.offsetHeight
        });

        const imageUrl = canvas.toDataURL('image/png', 1.0);
        if (window.pywebview && window.pywebview.api) {
            // --- 1. PyWebview 환경일 때 ---
            // Python의 save_image() 함수에 dataURL 전달
            // Python 처리가 끝날 때까지 기다림 (비동기)
            await window.pywebview.api.save_image(imageUrl);

        } else {
            // --- 2. 일반 브라우저 환경일 때 (기존 로직) ---
            const link = document.createElement('a');
            const today = new Date();
            const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            link.download = `주간시간표_${dateString}.png`;
            link.href = imageUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } catch (error) {
        console.error("이미지 캡처 중 오류 발생:", error);
        alert("이미지를 생성하는 데 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
        document.body.removeChild(loadingMessage);
    }
}


/* ========================================================== */
/* 8. 유틸리티 함수 */
/* ========================================================== */

/** 특정 시간 슬롯이 비어있는지 확인합니다. */
function isTimeSlotAvailable(day, startTime, duration, ignoreId) {
    const start = timeToMinutes(startTime);
    const end = start + duration;

    if (end > endH * 60) return false;

    for (const item of schedule) {
        if (item.scheduleId === ignoreId || item.day !== day) {
            continue;
        }
        const itemStart = timeToMinutes(item.startTime);
        const itemEnd = itemStart + item.duration;

        // 겹치는지 확인: (내 시작 < 상대 끝) AND (내 끝 > 상대 시작)
        if (start < itemEnd && end > itemStart) {
            return false;
        }
    }
    return true;
}

/** "HH:MM" 형식의 시간을 분(minute)으로 변환합니다. */
function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;
    if (totalMinutes < startH * 60) {
        totalMinutes += 24 * 60;
    }
    return totalMinutes;
}

/** 분(minute)을 "HH:MM" 형식으로 변환합니다. (24시 버그 수정됨) */
function minutesToTime(minutes) {
    const hours = String(Math.floor(minutes / 60) % 24).padStart(2, '0');
    const mins = String(minutes % 60).padStart(2, '0');
    return `${hours}:${mins}`;
}

/** 배열을 무작위로 섞습니다. */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/** 예쁜 색상 팔레트 */
const prettyColors = [
    '#FF6B6B', '#FFD166', '#06D6A0', '#118AB2', '#073B4C',
    '#EE6C4D', '#9A6324', '#6A4C93', '#F781BE', '#2EC4B6'
];
let shuffledColors = [];

/** 섞인 색상 팔레트에서 순서대로 색상을 꺼내 씁니다. */
function getRandomColor() {
    if (shuffledColors.length === 0) {
        shuffledColors = [...prettyColors].sort(() => Math.random() - 0.5);
    }
    return shuffledColors.pop();
}

/** 중요도에 따라 정해진 색상을 반환합니다. */
function getPriorityColor(priority) {
    const priorityColors = {
        A: '#D32F2F', B: '#F57C00', C: '#388E3C',
        D: '#1976D2', E: '#7B1FA2'
    };
    return priorityColors[priority] || '#77777';
}


/* ========================================================== */
/* 8. (신규) 제목 편집 기능 */
/* ========================================================== */

/** H1 태그를 클릭하여 편집할 수 있도록 초기화합니다. */
function initializeTitleEditor() {
    const h1 = document.querySelector('.main-container h1');
    if (!h1) return;

    // 1. h1 태그를 편집 가능하도록 설정
    h1.contentEditable = true;
    h1.style.cursor = 'text';

    // 2. 편집 중 Enter 키를 누르면 줄바꿈 대신 편집 종료(blur)
    h1.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // 줄바꿈 방지
            h1.blur();          // focus 잃기 (편집 종료)
        }
    });

    // 3. (선택) 내용이 비어있으면 기본값으로 복원
    h1.addEventListener('blur', () => {
        if (h1.textContent.trim() === '') {
            h1.textContent = '주간 시간표';
        }
    });
}


/* ========================================================== */
/* 9. (신규) 테마 설정 모달 기능 */
/* ========================================================== */

const defaultColors = {
    titleColor: '#3498db',
    cellBg: '#FFFFFF',
    dayHeaderBg: '#f9f9f9',
    dayHeaderText: '#333333', // ▼▼▼ [신규] 추가 ▼▼▼
    timeLabelBg: '#fdfdfd',
    timeLabelText: '#777777', // ▼▼▼ [신규] 추가 ▼▼▼
    cellBorder: '#E0E0E0'
};

/** 테마 설정 모달의 이벤트 리스너를 초기화합니다. */
function initializeThemeModal() {
    const modalOverlay = document.getElementById('theme-modal-overlay');
    const closeBtn = document.getElementById('theme-modal-close-btn');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeThemeModal();
        });
    }
    if (closeBtn) closeBtn.addEventListener('click', closeThemeModal);

    // --- 컬러 피커 로직 ---
    const root = document.documentElement;
    const bgColorPicker = document.getElementById('grid-bg-color');
    const borderColorPicker = document.getElementById('grid-border-color');
    const bgResetBtn = document.getElementById('grid-bg-reset');
    const borderResetBtn = document.getElementById('grid-border-reset');
    const dayHeaderBgPicker = document.getElementById('day-header-bg-color');
    const dayHeaderBgReset = document.getElementById('day-header-bg-reset');
    const dayHeaderTextPicker = document.getElementById('day-header-text-color');
    const dayHeaderTextReset = document.getElementById('day-header-text-reset');
    const timeLabelBgPicker = document.getElementById('time-label-bg-color');
    const timeLabelBgReset = document.getElementById('time-label-bg-reset');
    const timeLabelTextPicker = document.getElementById('time-label-text-color');
    const timeLabelTextReset = document.getElementById('time-label-text-reset');

    const titleColorPicker = document.getElementById('title-color');
    const titleResetBtn = document.getElementById('title-color-reset');

    if (titleColorPicker) {
        titleColorPicker.addEventListener('input', (e) => {
            root.style.setProperty('--title-color', e.target.value);
        });
    }
    if (titleResetBtn) {
        titleResetBtn.addEventListener('click', () => {
            root.style.setProperty('--title-color', defaultColors.titleColor);
            titleColorPicker.value = defaultColors.titleColor;
        });
    }
    // 1. 셀 배경색 변경
    if (bgColorPicker) {
        bgColorPicker.addEventListener('input', (e) => {
            root.style.setProperty('--grid-cell-bg', e.target.value);
        });
    }


    if (dayHeaderBgPicker) {
        dayHeaderBgPicker.addEventListener('input', (e) => {
            root.style.setProperty('--day-header-bg', e.target.value);
        });
    }
    if (dayHeaderBgReset) {
        dayHeaderBgReset.addEventListener('click', () => {
            root.style.setProperty('--day-header-bg', defaultColors.dayHeaderBg);
            dayHeaderBgPicker.value = defaultColors.dayHeaderBg;
        });
    }
    if (dayHeaderTextPicker) {
        dayHeaderTextPicker.addEventListener('input', (e) => {
            root.style.setProperty('--day-header-text', e.target.value);
        });
    }
    if (dayHeaderTextReset) {
        dayHeaderTextReset.addEventListener('click', () => {
            root.style.setProperty('--day-header-text', defaultColors.dayHeaderText);
            dayHeaderTextPicker.value = defaultColors.dayHeaderText;
        });
    }
    if (timeLabelBgPicker) {
        timeLabelBgPicker.addEventListener('input', (e) => {
            root.style.setProperty('--time-label-bg', e.target.value);
        });
    }
    if (timeLabelBgReset) {
        timeLabelBgReset.addEventListener('click', () => {
            root.style.setProperty('--time-label-bg', defaultColors.timeLabelBg);
            timeLabelBgPicker.value = defaultColors.timeLabelBg;
        });
    }
    if (timeLabelTextPicker) {
        timeLabelTextPicker.addEventListener('input', (e) => {
            root.style.setProperty('--time-label-text', e.target.value);
        });
    }
    if (timeLabelTextReset) {
        timeLabelTextReset.addEventListener('click', () => {
            root.style.setProperty('--time-label-text', defaultColors.timeLabelText);
            timeLabelTextPicker.value = defaultColors.timeLabelText;
        });
    }
    // 2. 셀 테두리색 변경
    if (borderColorPicker) {
        borderColorPicker.addEventListener('input', (e) => {
            root.style.setProperty('--grid-border-color', e.target.value);
        });
    }

    // 3. 배경색 리셋
    if (bgResetBtn) {
        bgResetBtn.addEventListener('click', () => {
            root.style.setProperty('--grid-cell-bg', defaultColors.cellBg);
            bgColorPicker.value = defaultColors.cellBg;
        });
    }
    // 4. 테두리색 리셋
    if (borderResetBtn) {
        borderResetBtn.addEventListener('click', () => {
            root.style.setProperty('--grid-border-color', defaultColors.cellBorder);
            borderColorPicker.value = defaultColors.cellBorder;
        });
    }
}

/** 테마 설정 모달을 엽니다. */
function openThemeModal() {
    document.getElementById('theme-modal-overlay').classList.remove('hidden');
}

/** 테마 설정 모달을 닫습니다. */
function closeThemeModal() {
    document.getElementById('theme-modal-overlay').classList.add('hidden');
}

/** 사이드바 토글 버튼 및 오버레이 이벤트를 초기화합니다. */
function initializeSidebarToggle() {
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const overlay = document.getElementById('sidebar-overlay');

    if (toggleBtn) {
        // [변경] openSidebar -> toggleSidebar 함수로 변경
        toggleBtn.addEventListener('click', toggleSidebar);
    }

    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }
}
/** [신규] 사이드바 상태를 확인하고 열거나 닫습니다. */
function toggleSidebar() {
    const sidebar = document.querySelector('.batch-container');
    if (sidebar.classList.contains('is-open')) {
        closeSidebar();
    } else {
        openSidebar();
    }
}
/** 사이드바를 엽니다. */
function openSidebar() {
    const sidebar = document.querySelector('.batch-container');
    const overlay = document.getElementById('sidebar-overlay');

    overlay.classList.remove('hidden');
    // opacity 트랜지션을 위해 약간의 딜레이가 필요할 수 있습니다.
    setTimeout(() => {
        sidebar.classList.add('is-open');
        overlay.classList.add('is-open');
    }, 10);
}

/** 사이드바를 닫습니다. */
function closeSidebar() {
    const sidebar = document.querySelector('.batch-container');
    const overlay = document.getElementById('sidebar-overlay');

    sidebar.classList.remove('is-open');
    overlay.classList.remove('is-open');

    // 트랜지션이 끝난 후 (0.3초) 오버레이를 숨겨서
    // 뒤쪽 메인 컨텐츠가 클릭되도록 합니다.
    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 300);
}

/* ========================================================== */
/* 11. (신규) 날짜 헬퍼 함수 */
/* ========================================================== */

/**
 * YYYY-MM-DD 형식의 날짜 문자열이 해당 주(월~일)에 포함되는지 확인합니다.
 * @param {string} dateString - 'YYYY-MM-DD' 형식의 마감일
 * @param {Date} weekStart - 이번 주 월요일 00:00:00
 * @param {Date} weekEnd - 이번 주 일요일 23:59:59
 * @returns {boolean}
 */
function isDateInCurrentWeek(dateString, weekStart, weekEnd) {
    try {
        // 시간대 문제를 피하기 위해 T00:00:00 (로컬 시간)으로 파싱
        const dueDate = new Date(dateString + 'T00:00:00');

        // 유효하지 않은 날짜(Invalid Date)인 경우 false 반환
        if (isNaN(dueDate.getTime())) {
            return false;
        }

        // dueDate가 weekStart (월요일 00:00)보다 크거나 같고,
        // weekEnd (일요일 23:59)보다 작거나 같은지 확인
        return dueDate >= weekStart && dueDate <= weekEnd;
    } catch (e) {
        console.error("Date parsing error:", e);
        return false;
    }
}

/* ========================================================== */
/* 12. (신규) 유틸리티 함수 - 스로틀 */
/* ========================================================== */

/**
 * 연속적인 이벤트 발생 시, 일정 시간(limit)마다 최대 한 번만
 * 콜백 함수를 실행합니다. (Throttle)
 * @param {Function} func - 실행할 콜백 함수
 * @param {number} limit - 실행 간격 (밀리초)
 * @returns {Function} - 스로틀된 함수
 */
function throttle(func, limit) {
    let inThrottle; // 현재 스로틀(지연) 중인지 여부를 추적

    return function (...args) {
        const context = this;

        // inThrottle이 true이면 (즉, 쿨타임 중이면) 아무것도 하지 않음
        if (!inThrottle) {
            // 1. 함수를 즉시 실행
            func.apply(context, args);

            // 2. 쿨타임(inThrottle)을 true로 설정
            inThrottle = true;

            // 3. 'limit' 시간(예: 150ms) 후에 쿨타임을 false로 해제
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}

/* ========================================================== */
/* 13. (신규) 복사 & 붙여넣기 기능 */
/* ========================================================== */

/** [신규] 일정을 클립보드에 복사합니다. */
function handleCopy(scheduleId) {
    const itemToCopy = schedule.find(s => s.scheduleId === scheduleId);
    if (itemToCopy) {
        // scheduleId, day, startTime을 제외한 '내용물'을 복사합니다.
        clipboard = {
            subjectId: itemToCopy.subjectId,
            duration: itemToCopy.duration,
            isAutoPlaced: false, // 복사/붙여넣기는 수동으로 간주
            dueDate: null // 마감일은 복사하지 않음
        };
        // console.log('일정이 복사되었습니다:', clipboard);
    }
}

/** [신규] 빈 셀에 '붙여넣기' 컨텍스트 메뉴를 엽니다. */
function showEmptyCellContextMenu(x, y, day, time) {
    hideAllContextMenus(); // 모든 메뉴 숨기기

    const menu = document.getElementById('empty-cell-context-menu');
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.classList.remove('hidden');

    // 붙여넣을 위치 정보 저장
    currentEmptyCellMenu.target = menu;
    currentEmptyCellMenu.day = day;
    currentEmptyCellMenu.time = time;

    // '붙여넣기' 버튼 클릭 이벤트
    document.getElementById('context-paste').onclick = () => handlePaste();

    // 다른 곳 클릭 시 메뉴 닫기
    setTimeout(() => {
        window.addEventListener('click', hideEmptyCellContextMenu, { once: true });
    }, 0);
}

/** [신규] 클립보드의 일정을 빈 셀에 붙여넣습니다. */
function handlePaste() {
    const { day, time } = currentEmptyCellMenu;

    if (!clipboard || !day || !time) {
        return; // 붙여넣을 내용이나 위치 정보가 없음
    }

    // 1. 붙여넣을 공간이 비어있는지 확인
    if (!isTimeSlotAvailable(day, time, clipboard.duration, null)) {
        alert('해당 시간에 일정을 붙여넣을 수 없습니다. (시간 중복)');
        return;
    }

    // 2. 새 일정 객체 생성
    const newItem = {
        scheduleId: 's' + Date.now(),
        subjectId: clipboard.subjectId,
        day: day,
        startTime: time,
        duration: clipboard.duration,
        isAutoPlaced: clipboard.isAutoPlaced,
        dueDate: clipboard.dueDate
    };

    // 3. schedule 배열에 추가
    schedule.push(newItem);

    // 4. 화면 다시 그리기
    renderSchedule();

    // (선택사항) 붙여넣기 후 클립보드를 비우려면 아래 주석을 해제하세요.
    // clipboard = null; 
}

/* ========================================================== */
/* 14. (신규) 일정 시간 조절 (Resize) 기능 */
/* ========================================================== */

/**
 * 리사이즈 시작 (mousedown 이벤트)
 */
function handleResizeStart(e, scheduleId) {
    e.preventDefault();
    isResizing = true;

    const item = schedule.find(s => s.scheduleId === scheduleId);
    const overlay = document.querySelector(`.subject-title-overlay[data-schedule-id="${scheduleId}"]`);
    const cell = grid.querySelector('.schedule-cell'); // 30분짜리 셀 1개

    if (!item || !overlay || !cell) return;

    overlay.classList.add('is-resizing');

    // 리사이즈 정보 저장
    resizeInfo = {
        scheduleId: scheduleId,
        startY: e.clientY,
        originalHeight: overlay.offsetHeight,
        cellHeight: cell.offsetHeight,
        item: item // 원본 데이터 참조
    };

    // 마우스를 움직일 때(mousemove)와 뗄 때(mouseup) 이벤트를
    // '창(window)' 전체에 등록합니다.
    window.addEventListener('mousemove', throttledResizeHandler);
    window.addEventListener('mouseup', handleResizeEnd, { once: true });
}

/**
 * 리사이즈 중 (mousemove 이벤트 - 스로틀됨)
 * @param {MouseEvent} e
 */
function handleResizing(e) {
    if (!isResizing) return;

    // 1. 마우스가 움직인 거리 (Y축)
    const deltaY = e.clientY - resizeInfo.startY;

    // 2. 새로운 높이 계산 (원래 높이 + 움직인 거리)
    const newPixelHeight = resizeInfo.originalHeight + deltaY;

    // 3. 픽셀 높이를 30분 단위(cellHeight)로 "스냅"
    // (최소 1칸 = 30분)
    const newSlots = Math.max(1, Math.round(newPixelHeight / resizeInfo.cellHeight));
    const newDuration = newSlots * 30; // 새 지속 시간 (분)

    // 4. 스냅된 높이를 오버레이에 실시간으로 적용 (시각적 피드백)
    const snappedHeight = newSlots * resizeInfo.cellHeight;
    const overlay = document.querySelector(`.subject-title-overlay.is-resizing`);
    if (overlay) {
        overlay.style.height = `${snappedHeight}px`;

        // 5. [실시간 충돌 감지]
        const { item } = resizeInfo;
        const isValid = isTimeSlotAvailable(item.day, item.startTime, newDuration, item.scheduleId);

        // 유효하지 않으면 (다른 일정과 겹치면) 빨간색 테두리 표시
        overlay.classList.toggle('is-invalid', !isValid);
    }
}

/**
 * 리사이즈 종료 (mouseup 이벤트)
 */
function handleResizeEnd() {
    if (!isResizing) return;
    isResizing = false;

    const overlay = document.querySelector(`.subject-title-overlay.is-resizing`);
    if (!overlay) {
        // 혹시 모를 오류 방지
        window.removeEventListener('mousemove', throttledResizeHandler);
        renderSchedule(); // 그냥 원상복구
        return;
    }

    // 1. 최종 높이에서 새 지속 시간(분) 계산
    const finalPixelHeight = overlay.offsetHeight;
    const newSlots = Math.max(1, Math.round(finalPixelHeight / resizeInfo.cellHeight));
    const newDuration = newSlots * 30;

    // 2. 데이터 업데이트
    const item = schedule.find(s => s.scheduleId === resizeInfo.scheduleId);

    if (item) {
        // 3. [최종 충돌 감지]
        const isValid = isTimeSlotAvailable(item.day, item.startTime, newDuration, item.scheduleId);

        if (isValid) {
            // 유효하면: 데이터 업데이트
            item.duration = newDuration;
        } else {
            // 유효하지 않으면: 경고창
            alert('다른 일정과 겹쳐서 시간을 조절할 수 없습니다.');
        }
    }

    // 4. 전역 리스너 제거 및 정리
    window.removeEventListener('mousemove', throttledResizeHandler);
    overlay.classList.remove('is-resizing', 'is-invalid');
    resizeInfo = {};

    // 5. 최종본 렌더링 (성공했든 실패했든 원본 데이터 기준으로 다시 그림)
    renderSchedule();
}

/* ========================================================== */
/* 15. (신규) 배치 일정 수정 모달 기능 */
/* ========================================================== */

/**
 * '배치 일정 수정' 모달의 이벤트 리스너를 초기화합니다.
 */
function initializeBatchEditModal() {
    const modalOverlay = document.getElementById('batch-edit-modal-overlay');
    const closeBtn = document.getElementById('batch-edit-modal-close-btn');
    const form = document.getElementById('batch-edit-form');

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeBatchEditModal();
        });
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', closeBatchEditModal);
    }
    if (form) {
        form.addEventListener('submit', handleBatchEditFormSubmit);
    }
}
/* ▼▼▼ [교체] openBatchEditModal 함수 ▼▼▼ */
/**
 * '배치 일정 수정' 모달을 열고 폼 데이터를 채웁니다. (✨ '주간 총 시간' 로직으로 복원)
 * @param {object} task - 수정할 task 객체
 */
function openBatchEditModal(task) {
    // 1. 폼 데이터 채우기
    document.getElementById('batch-editing-id').value = task.id;
    document.getElementById('batch-edit-task-title').value = task.title;
    document.getElementById('batch-edit-task-due-date').value = task.dueDate || '';
    document.getElementById('batch-edit-task-priority').value = task.priority;
    // scheduleRule 관련 줄 삭제됨

    // 2. 모달 열기
    document.getElementById('batch-edit-modal-overlay').classList.remove('hidden');
}
/* ▲▲▲ [교체] 여기까지 ▲▲▲ */


/* ▼▼▼ [교체] handleBatchEditFormSubmit 함수 ▼▼▼ */
/**
 * '배치 일정 수정' 폼 제출을 처리합니다. (✨ '주간 총 시간' 로직으로 복원)
 */
function handleBatchEditFormSubmit(e) {
    e.preventDefault();

    // 1. 폼에서 값 읽어오기
    const taskId = document.getElementById('batch-editing-id').value;
    const newTitle = document.getElementById('batch-edit-task-title').value;
    const newDueDate = document.getElementById('batch-edit-task-due-date').value;
    const newPriority = document.getElementById('batch-edit-task-priority').value;
    // scheduleRule 관련 줄 삭제됨

    // 2. batchTasks 배열에서 원본 데이터 찾기
    const task = batchTasks.find(t => t.id === taskId);

    if (task) {
        // 3. 데이터 업데이트
        task.title = newTitle;
        task.dueDate = newDueDate || null;
        task.priority = newPriority;
        // scheduleRule 관련 줄 삭제됨
    }

    // 4. UI 갱신 및 모달 닫기
    renderBatchList();
    closeBatchEditModal();
    document.getElementById('batch-edit-form').reset();
}
/* ▲▲▲ [교체] 여기까지 ▲▲▲ */
/**
 * '배치 일정 수정' 모달을 닫습니다.
 */
function closeBatchEditModal() {
    document.getElementById('batch-edit-modal-overlay').classList.add('hidden');
    // (폼 리셋은 submit 핸들러가 처리)
}


/* ========================================================== */
/* 16. (신규) 최근 사용 색상 팔레트 기능 */
/* ========================================================== */

/**
 * 앱 시작 시 localStorage에서 저장된 색상을 불러옵니다.
 */
function loadUsedColors() {
    const storedColors = localStorage.getItem(LS_COLORS_KEY);
    if (storedColors) {
        try {
            const parsedColors = JSON.parse(storedColors);
            if (Array.isArray(parsedColors) && parsedColors.length > 0) {
                usedColors = parsedColors;
            }
        } catch (e) {
            console.error("최근 색상 불러오기 실패:", e);
            // 실패 시 기본값(전역 변수)을 사용
        }
    }
    // 저장된 색상이 없으면 전역 변수에 정의된 기본 색상을 사용합니다.
}

/**
 * usedColors 배열을 localStorage에 저장합니다.
 */
function saveUsedColors() {
    localStorage.setItem(LS_COLORS_KEY, JSON.stringify(usedColors));
}

/**
 * 새 색상을 usedColors 배열의 맨 앞에 추가합니다. (최대 12개)
 * @param {string} color - #RRGGBB 형식의 색상 코드
 */
function addUsedColor(color) {
    if (!color) return;

    // 1. 이미 배열에 있는지 확인 (중복 제거)
    const existingIndex = usedColors.indexOf(color);
    if (existingIndex > -1) {
        // 이미 있지만, 맨 앞이 아니라면 맨 앞으로 이동
        if (existingIndex > 0) {
            usedColors.splice(existingIndex, 1);
            usedColors.unshift(color);
            saveUsedColors();
        }
        return; // 이미 맨 앞에 있으므로 종료
    }

    // 2. 새 색상을 맨 앞에 추가
    usedColors.unshift(color);

    // 3. 팔레트 최대 개수 제한 (예: 12개)
    if (usedColors.length > 12) {
        usedColors = usedColors.slice(0, 12);
    }

    // 4. localStorage에 저장
    saveUsedColors();
}

/**
 * '새 일정 추가' 모달에 최근 사용 색상 팔레트를 그립니다.
 */
function renderRecentColorsPalette() {
    const palette = document.getElementById('recent-colors-palette');
    if (!palette) return;

    palette.innerHTML = ''; // 팔레트 비우기
    const colorInput = document.getElementById('subject-color'); // 메인 컬러 피커

    usedColors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        swatch.title = color; // 마우스 오버 시 색상 코드 표시

        // 스와치 클릭 시, 메인 컬러 피커의 색상을 변경
        swatch.addEventListener('click', () => {
            if (colorInput) {
                colorInput.value = color;
            }
        });

        palette.appendChild(swatch);
    });
}