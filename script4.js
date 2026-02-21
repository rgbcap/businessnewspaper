// 오늘 날짜 'YYYY-MM-DD' 형식으로 반환
function getTodayDate() {
    const today = new Date();
    const year  = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day   = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 이미지 URL 생성 함수 (HK, MK, SE 모두 지원)
function generateImageUrl(source, date, type, pagenum) {
    if (!['HK', 'MK', 'SE'].includes(source)) {
        throw new Error('source는 HK, MK, SE 중 하나여야 합니다.');
    }
    if (pagenum < 1 || !Number.isInteger(pagenum)) {
        throw new Error('pagenum은 1 이상의 정수여야 합니다.');
    }

    const [year, month, day] = date.split('-');

    if (source === 'HK') {
        const formattedDate = `${year}${month}${day}`;
        const paddedPage = pagenum.toString().padStart(3, '0');
        // sz=myun2400 으로 변경된 부분 유지
        return `https://plusimg.hankyung.com/apps/image.load?date=${formattedDate}&ftype=${type}&sz=myun2400&face=${type}${paddedPage}`;
    } 
    else if (source === 'MK') {
        const formattedDate = `${year}/${month}/${day}`;
        const typeMap = { 'A': '01', 'B': '02', 'C': '03', 'D': '04', 'E': '05' };
        const typeCode = typeMap[type];
        if (!typeCode) throw new Error('MK에서 지원하지 않는 type입니다.');
        const paddedPage = pagenum.toString().padStart(2, '0');
        return `https://file2.mk.co.kr/mkde/${formattedDate}/page/${typeCode}_${paddedPage}_ORG.jpg`;
    } 
    else if (source === 'SE') {
        // 서울경제: 페이지 번호 → SECTION = pagenum * 100
        const section = pagenum * 100;
        const formattedDate = `${year}/${month}/${day}`;
        const dateName = `${year}${month}${day}`;
        const fileName = `00001${String(section).padStart(5, '0')}_q10.jpg`;
        return `https://img.sedaily.com/DigitalPaper/${formattedDate}/02100311.${dateName}${fileName}`;
    }
}

// 여러 페이지 로드 (HK, MK용 - 기존 방식 유지)
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
        img.loading = 'lazy';
        img.onerror = () => {
            img.alt = `${page}면 (로드 실패)`;
            img.style.opacity = '0.5';
        };
        container.appendChild(img);
    }
}

// 한 페이지씩 로드 (SE용 + 필요 시 HK/MK에서도 사용 가능)
function loadSinglePage(source, date, type, pageNum) {
    const img = document.getElementById('mainImage');
    const loading = document.getElementById('loading');
    const errorDiv = document.getElementById('error');

    if (!img) return;

    img.style.display = 'none';
    if (errorDiv) errorDiv.style.display = 'none';
    if (loading) loading.style.display = 'block';

    try {
        const url = generateImageUrl(source, date, type, pageNum);
        img.src = url;

        img.onload = () => {
            if (loading) loading.style.display = 'none';
            img.style.display = 'block';
        };

        img.onerror = () => {
            if (loading) loading.style.display = 'none';
            if (errorDiv) {
                errorDiv.textContent = `페이지 ${pageNum} 로드 실패`;
                errorDiv.style.display = 'block';
            }
        };
    } catch (err) {
        if (loading) loading.style.display = 'none';
        if (errorDiv) {
            errorDiv.textContent = '오류: ' + err.message;
            errorDiv.style.display = 'block';
        }
    }
}

// SE 전용 페이지 이동 함수 예시 (SE.html에서 사용할 수 있도록)
function changeSEPage(delta) {
    // SE.html에서 전역 변수 currentPage, currentDate, currentSource 등을 사용한다고 가정
    window.currentPage = (window.currentPage || 1) + delta;
    if (window.currentPage < 1) window.currentPage = 1;

    loadSinglePage('SE', window.currentDate, null, window.currentPage);

    // 페이지 정보 업데이트 (SE.html에 #pageInfo 요소가 있다고 가정)
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) pageInfo.textContent = `페이지 ${window.currentPage}`;
}

// 기존 loadImagesForSelectedDate (HK/MK용 유지, SE는 별도 함수 사용 권장)
function loadImagesForSelectedDate() {
    const date = document.getElementById('dateInput').value;
    if (!date) {
        alert('날짜를 선택해주세요.');
        return;
    }

    const container = document.getElementById('imageContainer');
    const loading = document.getElementById('loading');
    const errorDiv = document.getElementById('error');

    if (container) container.innerHTML = '';
    if (errorDiv) errorDiv.style.display = 'none';
    if (loading) loading.style.display = 'block';

    const source = document.getElementById('sourceSelect')?.value || 'MK'; // 필요 시 select 추가
    const type = document.getElementById('typeSelect')?.value || 'A';
    const maxPages = parseInt(document.getElementById('pageCount')?.value) || 8;

    try {
        if (source === 'SE') {
            // SE는 한 장씩 → 첫 페이지 로드
            loadSinglePage(source, date, null, 1);
        } else {
            loadImages(source, date, type, maxPages);
        }
        if (loading) loading.style.display = 'none';
    } catch (err) {
        if (loading) loading.style.display = 'none';
        if (errorDiv) {
            errorDiv.textContent = '오류: ' + err.message;
            errorDiv.style.display = 'block';
        }
    }
}

// 날짜 표시 업데이트 (기존 그대로)
function updateDateDisplay(dateStr) {
    const display = document.getElementById('selectedDateDisplay');
    if (!display) return;
    const date = new Date(dateStr);
    const formatted = date.toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    });
    display.textContent = formatted;
}

// 초기 로드 및 이벤트 연결 (기존 그대로)
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('dateInput');
    if (dateInput) {
        const today = getTodayDate();
        dateInput.value = today;
        updateDateDisplay(today);
        loadImagesForSelectedDate();
    }

    if (dateInput) {
        dateInput.addEventListener('change', (e) => {
            updateDateDisplay(e.target.value);
            loadImagesForSelectedDate();
        });
    }
});