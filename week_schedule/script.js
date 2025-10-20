/* ========================================================== */
/* 1. 전역 변수 및 상수 */
/* ========================================================== */
const grid = document.getElementById('grid');
const startH = 8; // 그리드 시작 시간 (오전 8시)
const endH = 25;  // 그리드 종료 시간 (다음 날 새벽 1시)

let subjects = []; // { id, title, color }
let schedule = []; // { scheduleId, subjectId, day, startTime, duration, isAutoPlaced }
let batchTasks = []; // { id, title, priority }
let priorityMinutes = { A: 600, B: 480, C: 360, D: 240, E: 120 }; // 중요도별 목표 시간 (분)

let draggedInfo = null;
let currentContextMenu = { scheduleId: null, target: null };

/* ========================================================== */
/* 2. 초기화 함수 (페이지 로딩 시) */
/* ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
    createTimeGridRows();
    initializeButtons();
    initializeModal();
    initializeBatchContainer();
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

/** 자동 배치 사이드바의 이벤트 리스너를 초기화합니다. */
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

        // 1. 시간(hour) 드롭다운 채우기 (0 ~ 24시간)
        for (let i = 0; i <= 10; i++) {
            hSelect.add(new Option(i, i));
        }

        // 2. priorityMinutes 데이터로 드롭다운 초기값 설정
        const totalMins = priorityMinutes[prio];
        const hours = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        
        hSelect.value = hours;
        // 분(minute) 값이 0 또는 30이 아닐 경우 30으로 보정
        mSelect.value = (mins >= 30) ? 30 : 0; 

        // 3. ✨ [변경] input 대신 select에 이벤트 리스너 추가
        const updatePriority = () => {
            const h = parseInt(hSelect.value) || 0;
            const m = parseInt(mSelect.value) || 0;
            priorityMinutes[prio] = (h * 60) + m;
        };

        hSelect.addEventListener('change', updatePriority);
        mSelect.addEventListener('change', updatePriority);
    });

    // (샘플 데이터 및 renderBatchList 호출은 그대로 둡니다)
    batchTasks = [
        { id: 't1', title: '알고리즘 공부', priority: 'A' },
        { id: 't2', title: '영어 회화', priority: 'B' },
        { id: 't3', title: '프로젝트 기획', priority: 'C' },
    ];
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
    document.querySelectorAll('.due-date-marker').forEach(marker => marker.remove()); // ✨ [추가]
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
            titleOverlay.className = 'subject-title-overlay';
            titleOverlay.textContent = subject.title;
            titleOverlay.style.backgroundColor = subject.color; // 오버레이에도 배경색 적용

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

        // 👇 [수정] 드래그 이벤트 리스너 추가
        cell.addEventListener('dragover', handleDragOver);
        cell.addEventListener('dragleave', clearDragHighlights); // ✨ [추가]
        cell.addEventListener('drop', handleDrop);
    });

    // 5. ✨ [신규] 마감일 렌더링
    renderDueDates();
}

/** 컨텍스트 메뉴(우클릭 메뉴)를 엽니다. */
function showContextMenu(x, y, scheduleId) {
    hideContextMenu(); // 기존 메뉴 숨기기
    const menu = document.getElementById('context-menu');
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.classList.remove('hidden');
    currentContextMenu.scheduleId = scheduleId;
    currentContextMenu.target = menu;

    document.getElementById('context-edit').onclick = () => handleEdit(scheduleId);
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
                cell.style.opacity = '0.5';
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

/** (Create) 배치 목록에 새 일정을 추가합니다. */
function handleAddTask(e) {
    e.preventDefault();
    const titleInput = document.getElementById('task-title');
    
    // 1. [수정] <select> 드롭다운에서 우선순위를 읽어옵니다.
    const prioritySelect = document.getElementById('task-priority');
    const priority = prioritySelect.value; // 'A', 'B', 'C' 등
    
    // 2. 마감일 값을 읽어옵니다.
    const dueDateInput = document.getElementById('task-due-date');

    if (titleInput.value) {
        // 3. 올바른 우선순위(priority)로 데이터를 저장합니다.
        batchTasks.push({
            id: 't' + Date.now(),
            title: titleInput.value,
            priority: priority,
            dueDate: dueDateInput.value || null
        });
        
        // 4. 목록을 다시 그립니다.
        renderBatchList();
        e.target.reset(); // 폼 리셋 (textarea, date, select)
        
        // 5. [수정] <select>의 값을 기본값('C')으로 리셋합니다.
        // (e.target.reset()이 이미 이 작업을 수행하지만,
        //  C가 selected이므로 명시적으로 둘 수 있습니다.)
        prioritySelect.value = 'C';
    }
}
/** (Read) 배치 목록을 화면에 다시 그립니다. */
function renderBatchList() {
    const listContainer = document.getElementById('batch-list');
    listContainer.innerHTML = '';
    const sortedTasks = [...batchTasks].sort((a, b) => a.priority.localeCompare(b.priority));

    sortedTasks.forEach(task => {
        const item = document.createElement('div');
        item.className = 'task-item';
        item.dataset.id = task.id;

        // ✨ [신규] 마감일 표시 로직
        let dueDateHtml = '';
        if (task.dueDate) {
            // YYYY-MM-DD 형식에서 월/일만 추출
            try {
                const date = new Date(task.dueDate + 'T00:00:00'); // 시간대 문제 방지
                const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
                dueDateHtml = `<span class="task-due-date">마감: ${formattedDate}</span>`;
            } catch (e) { console.error("Invalid date format:", task.dueDate); }
        }
        
        // ✨ [변경] HTML 구조 수정
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

/** (Update) 배치 목록의 일정을 수정합니다. */
function handleEditTask(e) {
    const taskId = e.target.closest('.task-item').dataset.id;
    const task = batchTasks.find(t => t.id === taskId);

    const newTitle = prompt('새 일정 이름을 입력하세요:', task.title);
    if (newTitle) task.title = newTitle;

    // ✨ [신규] 마감일 수정
    const newDueDate = prompt('새 마감일을 입력하세요 (YYYY-MM-DD 형식):', task.dueDate || '');
    if (newDueDate !== null) task.dueDate = newDueDate || null;

    // ✨ [변경] 우선순위 수정 (3-level)
    const newPriority = prompt('새 중요도(A, C, E)를 입력하세요:', task.priority)?.toUpperCase();
    if (newPriority && ['A', 'C', 'E'].includes(newPriority)) {
        task.priority = newPriority;
    } else if (newPriority) {
        alert("중요도는 'A', 'C', 'E' 중 하나여야 합니다.");
    }

    renderBatchList();
}
/** (Delete) 배치 목록의 일정을 삭제합니다. */
function handleDeleteTask(e) {
    const taskId = e.target.closest('.task-item').dataset.id;
    if (confirm('목록에서 이 일정을 삭제하시겠습니까?')) {
        batchTasks = batchTasks.filter(t => t.id !== taskId);
        renderBatchList();
    }
}

/** '자동 배치' 버튼을 눌렀을 때 실행되는 메인 함수 */
function handleBatchPlace() {
    // 1. 기존 자동 배치 일정 제거
    schedule = schedule.filter(item => !item.isAutoPlaced);

    // 2. 중요도별 목표 시간에 따라 일정 조각(chunk) 생성
    const chunks = [];
    batchTasks.forEach(task => {
        const totalDuration = priorityMinutes[task.priority]; // 분 단위 총 시간
        let remaining = totalDuration;
        while (remaining > 0) {
            const chunkSize = Math.min(remaining, 120); // 최대 2시간(120분) 단위로 자르기
            chunks.push({ title: task.title, duration: chunkSize, priority: task.priority });
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
                placeChunk(chunk, slot.day, slot.startTime);

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

/** 일정 조각을 시간표에 실제로 배치하는 헬퍼 함수 */
function placeChunk(chunk, day, startTime) {
    let subject = subjects.find(s => s.title === chunk.title);
    if (!subject) {
        subject = {
            id: Date.now() + subjects.length,
            title: chunk.title,
            color: getPriorityColor(chunk.priority),
        };
        subjects.push(subject);
    }
    schedule.push({
        scheduleId: 'auto' + Date.now() + Math.random(),
        subjectId: subject.id,
        day, startTime,
        duration: chunk.duration,
        isAutoPlaced: true,
    });
}


/* ========================================================== */
/* 7. 가져오기 / 내보내기 기능 */
/* ========================================================== */

/** 엑셀 양식 파일을 다운로드합니다. */
function handleDownloadDemo() {
    const link = document.createElement('a');
    link.href = 'data/demo.xlsx'; // 'data' 폴더에 'demo.xlsx' 파일이 있어야 함
    link.download = '일정_입력_양식.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

    merges.forEach(merge => {
        const startRow = merge.s.r;
        const startCol = merge.s.c;
        const endRow = merge.e.r;
        if (startRow <= headerRowIndex) return;
        const title = data[startRow][startCol];
        const day = dayMapping[header[startCol]];

        if (title && day) {
            const startTime = convertExcelTime(data[startRow][0]);
            const duration = (endRow - startRow + 1) * 30;
            let subject = newSubjects.get(title);
            if (!subject) {
                subject = { id: Date.now() + newSubjects.size, title, color: getRandomColor() };
                newSubjects.set(title, subject);
            }
            schedule.push({ scheduleId: `s${Date.now()}${startRow}${startCol}`, subjectId: subject.id, day, startTime, duration, isAutoPlaced: false });
            for (let r = startRow; r <= endRow; r++) {
                processedCells[r][startCol] = true;
            }
        }
    });

    for (let r = headerRowIndex + 1; r < data.length; r++) {
        for (let c = 1; c < header.length; c++) {
            if (processedCells[r][c]) continue;
            const title = data[r][c];
            const day = dayMapping[header[c]];
            if (title && day) {
                const startTime = convertExcelTime(data[r][0]);
                let subject = newSubjects.get(title);
                if (!subject) {
                    subject = { id: Date.now() + newSubjects.size, title, color: getRandomColor() };
                    newSubjects.set(title, subject);
                }
                schedule.push({ scheduleId: `s${Date.now()}${r}${c}`, subjectId: subject.id, day, startTime, duration: 30, isAutoPlaced: false });
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
        const link = document.createElement('a');
        const today = new Date();
        const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        link.download = `주간시간표_${dateString}.png`;
        link.href = imageUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
    return priorityColors[priority] || '#607D8B';
}

function renderDueDates() {
    const dayHeaders = ['일', '월', '화', '수', '목', '금', '토']; // Date.getDay() 순서

    batchTasks.forEach(task => {
        if (task.dueDate) {
            try {
                const dueDate = new Date(task.dueDate + 'T00:00:00');
                const dayOfWeek = dayHeaders[dueDate.getDay()]; // '월', '화', ...

                // 해당 요일의 헤더 셀을 찾습니다.
                const headerCell = Array.from(document.querySelectorAll('.day-header'))
                    .find(h => h.textContent === dayOfWeek);

                if (headerCell) {
                    const marker = document.createElement('div');
                    marker.className = 'due-date-marker';
                    marker.textContent = `🔥 ${task.title}`;
                    marker.title = `${task.title} (마감일)`;
                    headerCell.appendChild(marker);
                }
            } catch (e) {
                console.warn("Invalid due date found:", task.dueDate);
            }
        }
    });
}