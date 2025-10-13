// --- DOM 요소 참조 ---
const modalOverlay = document.getElementById('modal-overlay');
const modalContent = document.getElementById('modal-content');
const modalCloseBtn = document.getElementById('modal-close-btn');
const subjectForm = document.getElementById('subject-form');

// ==========================================================
// ✨ 1. 모달 관련 함수들
// ==========================================================

/**
 * 모달을 열고 폼을 초기화하는 함수
 * @param {object} data - { day, startTime } 셀 클릭 시 전달되는 데이터
 */
function openModal(data = {}) {
    subjectForm.reset(); // 폼 초기화
    populateTimeOptions(); // 시간 옵션 채우기

    // 셀 클릭 시 전달된 데이터로 폼 기본값 설정
    if (data.day) subjectForm['subject-day'].value = data.day;
    if (data.startTime) subjectForm['subject-start-time'].value = data.startTime;

    // 현재 폼 값 기준으로 공부 시간 옵션 동적 업데이트
    updateDurationOptions();
    
    modalOverlay.classList.remove('hidden');
}

function closeModal() {
    modalOverlay.classList.add('hidden');
}

/**
 * 모달의 '공부 시간' 드롭다운을 동적으로 업데이트하는 함수
 */
function updateDurationOptions() {
    const day = subjectForm['subject-day'].value;
    const startTime = subjectForm['subject-start-time'].value;
    const durationSelect = subjectForm['subject-duration'];
    durationSelect.innerHTML = ''; // 기존 옵션 초기화

    // 선택된 요일, 시작 시간부터 연속으로 비어있는 최대 시간(분) 계산
    let maxDuration = 0;
    let available = true;
    while(available) {
        const nextTime = minutesToTime(timeToMinutes(startTime) + maxDuration);
        // 시간표 끝을 넘어가면 중단
        if (timeToMinutes(nextTime) >= endH * 60) {
             available = false;
             continue;
        }

        if (isTimeSlotAvailable(day, nextTime, 30, null)) {
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
        option.textContent = '추가할 수 있는 시간이 없습니다';
        option.disabled = true;
        durationSelect.appendChild(option);
    }
}

/**
 * 모달 폼 제출 시 데이터를 저장하는 함수
 */
function handleFormSubmit(e) {
    e.preventDefault();
    
    const title = subjectForm['subject-title'].value;
    const day = subjectForm['subject-day'].value;
    const startTime = subjectForm['subject-start-time'].value;
    const duration = parseInt(subjectForm['subject-duration'].value);
    const color = subjectForm['subject-color'].value;

    if (!title || !duration) {
        alert('과목명과 공부 시간을 올바르게 입력해주세요.');
        return;
    }

    // 최종 충돌 검사
    if (!isTimeSlotAvailable(day, startTime, duration, null)) {
        alert('해당 시간에 이미 다른 과목이 있습니다. 시간을 다시 확인해주세요.');
        return;
    }
    
    // 과목이 이미 존재하는지 확인, 없으면 새로 생성
    let subject = subjects.find(s => s.title.toLowerCase() === title.toLowerCase());
    if (!subject) {
        subject = {
            id: Date.now(), // 고유 ID
            title: title,
            color: color
        };
        subjects.push(subject);
    }

    // 새 스케줄 항목 생성
    const newScheduleItem = {
        scheduleId: 's' + Date.now(), // 고유 ID
        subjectId: subject.id,
        day: day,
        startTime: startTime,
        duration: duration
    };
    schedule.push(newScheduleItem);
    
    renderSchedule();
    closeModal();
}

function initializeModal() {
    modalCloseBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    subjectForm.addEventListener('submit', handleFormSubmit);
    
    // 요일이나 시작 시간이 변경될 때마다 공부 시간 옵션 다시 계산
    subjectForm['subject-day'].addEventListener('change', updateDurationOptions);
    subjectForm['subject-start-time'].addEventListener('change', updateDurationOptions);
}

// ==========================================================
// ✨ 3. 헬퍼 함수 (모달 지원용)
// ==========================================================

/** 모달의 시작 시간 옵션을 채우는 함수 */
function populateTimeOptions() {
    const startTimeSelect = subjectForm['subject-start-time'];
    startTimeSelect.innerHTML = '';
    for (let h = startH; h < endH; h++) {
        for (let m = 0; m < 60; m += 30) {
            const timeString = `${String(h % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            const option = document.createElement('option');
            option.value = timeString;
            option.textContent = timeString;
            startTimeSelect.appendChild(option);
        }
    }
}