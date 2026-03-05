// 오늘 날짜 'YYYY-MM-DD' 형식으로 반환
function getTodayDate() {
    const today = new Date();
    const year  = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day   = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
// 신문사별로 다른 기준 시:분을 반환하는 함수
function getThresholdForSource(source) {
    // 기본값: 대부분 18:00
    let thresholdHour = 18;
    let thresholdMinute = 0;

    switch (source) {
        case 'HK':  // 한경 - 예: 18:00
            thresholdHour = 18;
            thresholdMinute = 0;
            break;
        case 'MK':  // 매경 - 예: 17:30
            thresholdHour = 18;
            thresholdMinute = 20;
            break;
        case 'SE':  // 서울경제 - 예: 23:59
            thresholdHour = 18;
            thresholdMinute = 00;
            break;
        case 'FN':  // 파이낸셜뉴스 - 예: 18:20
            thresholdHour = 18;
            thresholdMinute = 20;
            break;
        case 'JA':  // 중앙일보 - 예: 23:59
            thresholdHour = 23;
            thresholdMinute = 59;
            break;
        case 'AK':  // 아시아경제 - 예: 23:59
            thresholdHour = 23;
            thresholdMinute = 59;
            break;
        default:
            // 알 수 없는 신문사는 기본값
            thresholdHour = 18;
            thresholdMinute = 0;
    }

    return { hour: thresholdHour, minute: thresholdMinute };
}

// 신문사별 기준 시간을 고려한 날짜 반환
function getEffectiveDate(source) {
    const now = new Date();
    const { hour: thresholdHour, minute: thresholdMinute } = getThresholdForSource(source);

    // 기준 시간 객체 (오늘 날짜 + 기준 시:분)
    const threshold = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        thresholdHour,
        thresholdMinute,
        0
    );

    // 현재 시간이 기준 시:분 이상이면 다음 날짜로
    if (now >= threshold) {
        now.setDate(now.getDate() + 1);
    }

    const year  = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day   = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}


// 이미지 URL 생성 함수 (HK, MK, SE, FN 모두 지원)
function generateImageUrl(source, date, type, pagenum) {
    if (!['HK', 'MK', 'SE', 'FN'].includes(source)) {
        throw new Error('source는 HK, MK, SE, FN 중 하나여야 합니다.');
    }
    if (pagenum < 1 || !Number.isInteger(pagenum)) {
        throw new Error('pagenum은 1 이상의 정수여야 합니다.');
    }

    const [year, month, day] = date.split('-');

    if (source === 'HK') {
        const formattedDate = `${year}${month}${day}`;
        const paddedPage = pagenum.toString().padStart(3, '0');
        return `https://plusimg.hankyung.com/apps/image.load?date=${formattedDate}&ftype=A&sz=myun2400&face=${type}${paddedPage}`;
    } 
    else if (source === 'MK') {
        const formattedDate = `${year}/${month}/${day}`;
        const typeMap = { 'A': '01', 'B': '02', 'C': '03', 'D': '04', 'E': '05' };
        const typeCode = typeMap[type];
        if (!typeCode) throw new Error('MK에서 지원하지 않는 type입니다.');
        const paddedPage = pagenum.toString().padStart(2, '0');
        return `https://file2.mk.co.kr/mkde/${formattedDate}/page/${typeCode}_${paddedPage}_BIG.jpg`;
    }
    else if (source === 'FN') {
        const formattedDate = `${year}/${month}/${day}`;
        const dateName = `${year}${month}${day}`;
        const paddedPage = pagenum.toString().padStart(2, '0');
        // 접미사: 1페이지 '_l.jpg', 2페이지 '_I.jpg' (예시 따라 구분, 홀수 l, 짝수 I로 확장)
        const suffix = (pagenum % 2 === 1) ? '_l.jpg' : '_l.jpg';
        return `https://www.fnnews.com/resource/paper/image/${formattedDate}/f${dateName}${paddedPage}0101${suffix}`;
    }
    else if (source === 'SE') {
        const section = pagenum * 100;
        const formattedDate = `${year}/${month}/${day}`;
        const dateName = `${year}${month}${day}`;
        const fileName = `00001${String(section).padStart(5, '0')}_q10.jpg`;
        return `https://wimg.sedaily.com/svc/epaper/${formattedDate}/02100311.${dateName}${fileName}`;
    } 
}

// 한 페이지 로드 함수 (모든 신문사 공통)
function loadCurrentPage(source, date, type, pageNum) {
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
            document.getElementById('pageInfo').textContent = `페이지 ${pageNum}`;
        };
        img.onerror = () => {
            if (loading) loading.style.display = 'none';
            if (errorDiv) {
                errorDiv.textContent = `페이지 ${pageNum}을(를) 불러올 수 없습니다.\n(해당 날짜에 신문이 없거나 서버에서 제공하지 않습니다)`;
                errorDiv.style.display = 'block';
            }
            document.getElementById('pageInfo').textContent = `페이지 ${pageNum}`;
        };
    } catch (err) {
        if (loading) loading.style.display = 'none';
        if (errorDiv) {
            errorDiv.textContent = '오류: ' + err.message;
            errorDiv.style.display = 'block';
        }
    }
}






