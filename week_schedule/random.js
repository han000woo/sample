let batchTasks = [];

/** 배치 컨테이너의 모든 이벤트를 초기화하는 함수 */
function initializeBatchContainer() {
    const batchForm = document.getElementById('batch-form');
    const batchPlaceBtn = document.getElementById('batch-place-btn');

    batchForm.addEventListener('submit', handleAddTask);
    batchPlaceBtn.addEventListener('click', handleBatchPlace);

    // 샘플 데이터 추가
    batchTasks = [
        { id: 't1', title: '알고리즘 공부', totalDuration: 240 },
        { id: 't2', title: '영어 회화', totalDuration: 90 },
        { id: 't3', title: '프로젝트 기획', totalDuration: 180 },
    ];
    renderBatchList();
}

/** 목록에 새 일정을 추가하는 함수 (Create) */
function handleAddTask(e) {
    e.preventDefault();
    const titleInput = document.getElementById('task-title');
    const durationH = parseInt(document.getElementById('task-duration').value) || 0;
    const durationM = parseInt(document.getElementById('task-duration-min').value) || 0;
    const totalDuration = durationH * 60 + durationM;

    if (titleInput.value && totalDuration > 0) {
        const newTask = {
            id: 't' + Date.now(),
            title: titleInput.value,
            totalDuration: totalDuration,
        };
        batchTasks.push(newTask);
        renderBatchList();
        e.target.reset(); // 폼 초기화
    }
}

/** 배치 목록을 화면에 다시 그리는 함수 (Read) */
function renderBatchList() {
    const listContainer = document.getElementById('batch-list');
    listContainer.innerHTML = ''; // 목록 비우기

    batchTasks.forEach(task => {
        const item = document.createElement('div');
        item.className = 'task-item';
        item.dataset.id = task.id;

        const hours = Math.floor(task.totalDuration / 60);
        const mins = task.totalDuration % 60;
        const durationText = `${hours > 0 ? `${hours}시간` : ''} ${mins > 0 ? `${mins}분` : ''}`.trim();

        item.innerHTML = `
            <div class="task-info">
                ${task.title}
                <span class="task-duration">(${durationText})</span>
            </div>
            <div class="task-actions">
                <button class="edit-task" title="수정"><span class="material-icons">edit</span></button>
                <button class="delete-task" title="삭제"><span class="material-icons">delete</span></button>
            </div>
        `;
        listContainer.appendChild(item);
    });

    // 수정(Update) 및 삭제(Delete) 버튼에 이벤트 리스너 추가
    document.querySelectorAll('.edit-task').forEach(btn => btn.addEventListener('click', handleEditTask));
    document.querySelectorAll('.delete-task').forEach(btn => btn.addEventListener('click', handleDeleteTask));
}

/** 목록의 일정을 수정하는 함수 (Update) */
function handleEditTask(e) {
    const item = e.target.closest('.task-item');
    const taskId = item.dataset.id;
    const task = batchTasks.find(t => t.id === taskId);

    // 간단하게 prompt로 수정 (모달로 확장 가능)
    const newTitle = prompt('새 일정 이름을 입력하세요:', task.title);
    if (newTitle) {
        task.title = newTitle;
    }
    const newDuration = prompt('새 소요 시간(분)을 입력하세요:', task.totalDuration);
    if (newDuration && !isNaN(newDuration)) {
        task.totalDuration = parseInt(newDuration);
    }
    renderBatchList();
}

/** 목록의 일정을 삭제하는 함수 (Delete) */
function handleDeleteTask(e) {
    const item = e.target.closest('.task-item');
    const taskId = item.dataset.id;
    if (confirm('목록에서 이 일정을 삭제하시겠습니까?')) {
        batchTasks = batchTasks.filter(t => t.id !== taskId);
        renderBatchList();
    }
}

/** '자동 배치' 버튼을 눌렀을 때 실행되는 메인 함수 */
function handleBatchPlace() {
    // 1. 기존에 '자동 배치'되었던 일정들만 모두 제거
    schedule = schedule.filter(item => !item.isAutoPlaced);

    // 2. 배치할 일정 '조각(chunk)'들 준비 (최대 2시간 단위)
    const chunks = [];
    batchTasks.forEach(task => {
        let remaining = task.totalDuration;
        while (remaining > 0) {
            const chunkSize = Math.min(remaining, 120); // 최대 2시간(120분)
            chunks.push({ title: task.title, duration: chunkSize });
            remaining -= chunkSize;
        }
    });

    // 3. 평일의 모든 빈 시간 슬롯 찾기
    const weekdays = ['월', '화', '수', '목', '금'];
    const availableSlots = [];
    for (const day of weekdays) {
        for (let h = startH; h < endH; h++) {
            for (let m = 0; m < 60; m += 30) {
                const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                availableSlots.push({ day, startTime: time });
            }
        }
    }

    // 4. 랜덤하게 섞고, 빈 곳에 일정 배치
    shuffleArray(chunks); // 일정 조각 섞기

    chunks.forEach(chunk => {
        shuffleArray(availableSlots); // 매번 슬롯을 다시 섞어 무작위성 증대

        let placed = false;
        for (let i = 0; i < availableSlots.length; i++) {
            const slot = availableSlots[i];
            // 해당 슬롯에 이 청크를 놓을 수 있는지 최종 확인
            if (isTimeSlotAvailable(slot.day, slot.startTime, chunk.duration, null)) {
                placeChunk(chunk, slot.day, slot.startTime);
                placed = true;
                break; // 배치 성공 시 다음 청크로 넘어감
            }
        }
    });

    // 5. 최종적으로 화면 다시 그리기
    renderSchedule();
}

/** 일정 조각을 시간표에 실제로 배치하는 헬퍼 함수 */
function placeChunk(chunk, day, startTime) {
    let subject = subjects.find(s => s.title === chunk.title);
    if (!subject) {
        subject = {
            id: Date.now() + subjects.length,
            title: chunk.title,
            color: getRandomColor(),
        };
        subjects.push(subject);
    }
    schedule.push({
        scheduleId: 'auto' + Date.now() + Math.random(),
        subjectId: subject.id,
        day: day,
        startTime: startTime,
        duration: chunk.duration,
        isAutoPlaced: true, // ✨ 자동 배치된 일정임을 표시
    });
}


// ==========================================================
// ✨ 유틸리티 함수
// ==========================================================
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
