// script.js

/**
 * ✨ [최종 버전] 엑셀의 '셀 병합' 정보를 직접 읽어 종료 시간을
 * 완벽하게 계산하는 가장 안정적인 파싱 함수
 */
function parseScheduleData(data, worksheet) { // worksheet를 추가로 받도록 수정
    // 헤더 행 찾기 및 기본 변수 설정
    const headerRowIndex = data.findIndex(row => row && row.includes('월요일'));
    if (headerRowIndex === -1) throw new Error("요일 헤더(월요일, 화요일...)를 찾을 수 없습니다.");

    const header = data[headerRowIndex];
    const dayMapping = { '월요일': '월', '화요일': '화', '수요일': '수', '목요일': '목', '금요일': '금', '토요일': '토', '일요일': '일' };
    const newSubjects = new Map();

    // ✨ [핵심 1] 셀 병합 정보 가져오기
    // worksheet['!merges']는 [{s:{r:6, c:1}, e:{r:11, c:1}}, ...] 와 같은 형식의 배열입니다.
    // s = start, e = end, r = row, c = col
    const merges = worksheet['!merges'] || [];

    // 이미 처리된 셀을 기록하기 위한 2차원 배열
    const processedCells = Array(data.length).fill(0).map(() => Array(header.length).fill(false));

    // ✨ [핵심 2] 병합된 셀부터 먼저 처리
    merges.forEach(merge => {
        const startRow = merge.s.r;
        const startCol = merge.s.c;
        const endRow = merge.e.r;

        // 병합된 셀의 시작점이 데이터 영역인지 확인
        if (startRow <= headerRowIndex) return;

        const title = data[startRow][startCol];
        const day = dayMapping[header[startCol]];

        if (title && day) {
            const startTime = convertExcelTime(data[startRow][0]);
            // 병합된 행의 개수로 정확한 duration 계산
            const duration = (endRow - startRow + 1) * 30;

            // subjects 및 schedule 배열에 데이터 추가
            let subject = newSubjects.get(title);
            if (!subject) {
                subject = { id: Date.now() + newSubjects.size, title, color: getRandomColor() };
                newSubjects.set(title, subject);
            }
            schedule.push({ scheduleId: `s${Date.now()}${startRow}${startCol}`, subjectId: subject.id, day, startTime, duration });

            // 이 병합에 포함된 모든 셀을 '처리 완료'로 표시
            for (let r = startRow; r <= endRow; r++) {
                processedCells[r][startCol] = true;
            }
        }
    });

    // ✨ [핵심 3] 병합되지 않은 나머지 단일 셀 처리
    for (let r = headerRowIndex + 1; r < data.length; r++) {
        for (let c = 1; c < header.length; c++) {
            // 이미 병합된 셀의 일부로 처리되었다면 건너뛰기
            if (processedCells[r][c]) continue;

            const title = data[r][c];
            const day = dayMapping[header[c]];

            if (title && day) {
                const startTime = convertExcelTime(data[r][0]);
                // 단일 셀이므로 duration은 30분
                let subject = newSubjects.get(title);
                if (!subject) {
                    subject = { id: Date.now() + newSubjects.size, title, color: getRandomColor() };
                    newSubjects.set(title, subject);
                }
                schedule.push({ scheduleId: `s${Date.now()}${r}${c}`, subjectId: subject.id, day, startTime, duration: 30 });
            }
        }
    }

    subjects = Array.from(newSubjects.values());
}

// ✨ [수정] handleExcelImport 함수에서 worksheet를 전달하도록 수정
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
            // ✨ worksheet를 parseScheduleData 함수에 추가로 전달
            parseScheduleData(jsonData, worksheet);
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

// 헬퍼 함수 (이전과 동일하거나 신규)
function convertExcelTime(excelTime) {
    if (excelTime === null || isNaN(excelTime)) return "00:00";
    const totalMinutes = Math.round(excelTime * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    // 30분 단위로 시간 보정
    const roundedMinutes = minutes < 30 ? 0 : 30;
    return `${String(hours).padStart(2, '0')}:${String(roundedMinutes).padStart(2, '0')}`;
}


async function handleImageExport() {
    const captureArea = document.querySelector('.main-container');
    const loadingMessage = document.createElement('div');

    // 1. 사용자에게 작업이 진행 중임을 알리는 메시지 표시
    loadingMessage.textContent = '이미지 생성 중... 잠시만 기다려주세요.';
    loadingMessage.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        padding: 20px 40px; background-color: rgba(0,0,0,0.7); color: white;
        border-radius: 10px; z-index: 9999;
    `;
    document.body.appendChild(loadingMessage);

    try {
        // 2. html2canvas를 사용하여 안정적인 옵션으로 캡처
        const canvas = await html2canvas(captureArea, {
            // ✨ [핵심] 외부 리소스를 더 잘 처리하기 위한 옵션들
            allowTaint: true,
            useCORS: true,
            logging: false, // 콘솔 로그를 비활성화하여 깔끔하게

            // ✨ 렌더링 품질 향상 옵션
            scale: window.devicePixelRatio, // 기기의 픽셀 비율에 맞춰 선명하게
            scrollX: -window.scrollX,
            scrollY: -window.scrollY,
            windowWidth: document.documentElement.offsetWidth,
            windowHeight: document.documentElement.offsetHeight
        });

        // 3. 캡처된 결과를 이미지 URL로 변환
        const imageUrl = canvas.toDataURL('image/png', 1.0); // 품질 100%

        // 4. 임시 <a> 태그를 만들어 다운로드 실행
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
        // 5. 성공하든 실패하든 로딩 메시지 제거
        document.body.removeChild(loadingMessage);
    }
}

function handleDownloadDemo() {
    // 1. 임시 <a> 태그(링크) 생성
    const link = document.createElement('a');

    // 2. 다운로드할 파일의 경로 설정
    //    (HTML 파일을 기준으로 data 폴더 안의 demo.xlsx 파일을 가리킵니다)
    link.href = 'data/demo.xlsx';

    // 3. 다운로드 시 저장될 파일 이름 지정
    link.download = '일정_입력_양식.xlsx';

    // 4. body에 임시 링크를 추가하고 클릭 이벤트를 실행
    document.body.appendChild(link);
    link.click();

    // 5. 다운로드를 실행한 후 임시 링크를 제거
    document.body.removeChild(link);
}