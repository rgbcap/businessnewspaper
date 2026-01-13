// 선택한 날짜로 이미지 로드
function loadImagesForSelectedDate() {
    const date = document.getElementById('dateInput').value;
    if (!date) {
        alert('날짜를 선택해주세요.');
        return;
    }

    const container = document.getElementById('imageContainer');
    const loading = document.getElementById('loading');
    const errorDiv = document.getElementById('error');

    container.innerHTML = '';
    errorDiv.style.display = 'none';
    loading.style.display = 'block';

    const type = document.getElementById('typeSelect').value;
    const maxPages = parseInt(document.getElementById('pageCount').value);

    try {
        loadImages('MK', date, type, maxPages);
        loading.style.display = 'none';
    } catch (err) {
        loading.style.display = 'none';
        errorDiv.textContent = '오류: ' + err.message;
        errorDiv.style.display = 'block';
    }
}

// 페이지 로드 시 오늘 날짜로 input 기본값 설정 + 표시
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('dateInput');
    const today = getTodayDate();
    dateInput.value = today;
    updateDateDisplay(today);

    // 처음 로드 시 자동으로 불러오기 (선택사항)
    loadImagesForSelectedDate();
});

// 선택된 날짜 표시 업데이트
function updateDateDisplay(dateStr) {
    const display = document.getElementById('selectedDateDisplay');
    const date = new Date(dateStr);
    const formatted = date.toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    });
    display.textContent = formatted;
}

// 날짜 변경 시 표시 업데이트 (실시간 반영)
document.getElementById('dateInput').addEventListener('change', (e) => {
    updateDateDisplay(e.target.value);
    loadImagesForSelectedDate();
});


// 오늘 날짜 'YYYY-MM-DD' 형식으로 반환
function getTodayDate() {
    const today = new Date();
    const year  = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day   = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 이미지 URL 생성 함수 (이전 답변 그대로)
function generateImageUrl(source, date, type, pagenum) {
    if (!['HK', 'MK'].includes(source)) {
        throw new Error('source는 "HK" 또는 "MK" 이어야 합니다.');
    }
    if (!['A', 'B', 'C', 'D', 'E'].includes(type)) {
        throw new Error('type은 A,B,C,D,E 중 하나여야 합니다.');
    }
    if (typeof pagenum !== 'number' || pagenum < 1 || !Number.isInteger(pagenum)) {
        throw new Error('pagenum은 1 이상의 정수여야 합니다.');
    }

    const [year, month, day] = date.split('-');
    let formattedDate;
    let url;

    if (source === 'HK') {
        formattedDate = `${year}${month}${day}`;
        const paddedPage = pagenum.toString().padStart(3, '0');
        url = `https://plusimg.hankyung.com/apps/image.load?date=${formattedDate}&ftype=A&sz=myun2400&face=${type}${paddedPage}`;
    } else if (source === 'MK') {
        formattedDate = `${year}/${month}/${day}`;
        const typeMap = { 'A': '01', 'B': '02', 'C': '03', 'D': '04', 'E': '05' };
        const typeCode = typeMap[type];
        if (!typeCode) throw new Error('MK에서 지원하지 않는 type입니다.');
        const paddedPage = pagenum.toString().padStart(2, '0');
        url = `https://file2.mk.co.kr/mkde/${formattedDate}/page/${typeCode}_${paddedPage}_ORG.jpg`;
    }

    return url;
}

// 여러 페이지 이미지 로드 (HTML에 id=imageContainer인 요소가 있어야 함)
function loadImages(source, date, type, maxPages) {
    const container = document.getElementById('imageContainer');
    if (!container) {
        console.error('imageContainer 요소를 찾을 수 없습니다.');
        return;
    }

    for (let page = 1; page <= maxPages; page++) {
        const url = generateImageUrl(source, date, type, page);
        const img = document.createElement('img');
        img.src = url;
        img.alt = `${page}면`;
        img.loading = 'lazy';           // 성능 향상
        img.onerror = () => {
            img.alt = `${page}면 (이미지 로드 실패)`;
            img.style.opacity = '0.5';
        };
        container.appendChild(img);
    }

}
