const startH = 8;
const endH = 25;
const grid = document.getElementById('grid');
const timeCol = grid.querySelector('.time-col');

document.addEventListener('DOMContentLoaded', () => {
    // 페이지 로드 시 시간 그리드와 요일 셀 생성
    createTimeGridRows();
    initializeButtons();
    initializeDragAndDrop();
    initializeModal(); //모달 초기화 함수 호출

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

                cell.addEventListener('click', () => {
                    // 셀에 'colored' 클래스가 없으면 (즉, 비어있으면) 모달 열기
                    if (!cell.classList.contains('colored')) {
                        openModal({ day: cell.dataset.day, startTime: cell.dataset.time });
                    }
                });

                grid.appendChild(cell);
            });
        }
    }
}

/**
 * 모달을 열고 폼을 초기화하는 함수
 * @param {object} data - { day, startTime } 셀 클릭 시 전달되는 데이터
 */
function openModal(data = {}) {
    subjectForm.reset();
    populateTimeOptions();

    const modalTitle = document.querySelector('#modal-content h2');
    const editingIdInput = document.getElementById('editing-schedule-id');

    // 수정 모드인 경우 (data에 scheduleId가 있을 때)
    if (data.scheduleId) {
        modalTitle.textContent = '일정 수정';
        editingIdInput.value = data.scheduleId;
        subjectForm['subject-title'].value = data.title;
        subjectForm['subject-day'].value = data.day;
        subjectForm['subject-start-time'].value = data.startTime;
        subjectForm['subject-color'].value = data.color;

        // 공부 시간 옵션을 업데이트하고 기존 값을 선택
        updateDurationOptions(data.scheduleId); // 자기 자신을 충돌 검사에서 제외
        subjectForm['subject-duration'].value = data.duration;
    }
    // 추가 모드인 경우
    else {
        modalTitle.textContent = '새 일정 추가';
        editingIdInput.value = ''; // ID 필드 비우기
        if (data.day) subjectForm['subject-day'].value = data.day;
        if (data.startTime) subjectForm['subject-start-time'].value = data.startTime;
        updateDurationOptions();
    }

    modalOverlay.classList.remove('hidden');
}


function closeModal() {
    modalOverlay.classList.add('hidden');
}

/**
 * 모달의 '공부 시간' 드롭다운을 동적으로 업데이트하는 함수
 */
function updateDurationOptions(ignoreId = null) {
    const day = subjectForm['subject-day'].value;
    const startTime = subjectForm['subject-start-time'].value;
    const durationSelect = subjectForm['subject-duration'];
    durationSelect.innerHTML = ''; // 기존 옵션 초기화

    // 선택된 요일, 시작 시간부터 연속으로 비어있는 최대 시간(분) 계산
    let maxDuration = 0;
    let available = true;
    while (available) {
        const nextTime = minutesToTime(timeToMinutes(startTime) + maxDuration);

        // ✨ [핵심] isTimeSlotAvailable 함수를 호출할 때 ignoreId를 전달합니다.
        if (isTimeSlotAvailable(day, nextTime, 30, ignoreId)) {
            maxDuration += 30;
        } else {
            available = false;
        }
    }

    // 계산된 최대 시간까지 30분 단위로 옵션 추가
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
        // 수정 모드일 때와 추가 모드일 때 다른 메시지 표시
        option.textContent = ignoreId ? '시간을 늘릴 수 없습니다' : '추가할 수 있는 시간이 없습니다';
        option.disabled = true;
        durationSelect.appendChild(option);
    }
}

/**
 * 모달 폼 제출 시 데이터를 저장하는 함수
 */
function handleFormSubmit(e) {
    e.preventDefault();

    const editingId = document.getElementById('editing-schedule-id').value;
    const title = subjectForm['subject-title'].value;
    const day = subjectForm['subject-day'].value;
    const startTime = subjectForm['subject-start-time'].value;
    const duration = parseInt(subjectForm['subject-duration'].value);
    const color = subjectForm['subject-color'].value;

    if (!title || !duration) {
        alert('일정명과 시간을 올바르게 입력해주세요.');
        return;
    }

    // 최종 충돌 검사 (수정 모드일 경우 자기 자신은 제외)
    if (!isTimeSlotAvailable(day, startTime, duration, editingId || null)) {
        alert('해당 시간에 이미 다른 일정이 있습니다. 시간을 다시 확인해주세요.');
        return;
    }

    // 과목 정보 가져오기 또는 생성
    let subject = subjects.find(s => s.title.toLowerCase() === title.toLowerCase());
    if (!subject) {
        subject = { id: Date.now(), title: title, color: color };
        subjects.push(subject);
    } else {
        // 기존 과목의 색상이 변경되었을 수 있으므로 업데이트
        subject.color = color;
    }

    // 수정 모드
    if (editingId) {
        const scheduleItem = schedule.find(item => item.scheduleId === editingId);
        scheduleItem.subjectId = subject.id;
        scheduleItem.day = day;
        scheduleItem.startTime = startTime;
        scheduleItem.duration = duration;
    }
    // 추가 모드
    else {
        schedule.push({
            scheduleId: 's' + Date.now(),
            subjectId: subject.id,
            day: day,
            startTime: startTime,
            duration: duration
        });
    }

    renderSchedule();
    closeModal();
}