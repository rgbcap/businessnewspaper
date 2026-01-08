document.addEventListener('DOMContentLoaded', () => {
// ===== Firebase 설정 =====
    const firebaseConfig = {
        apiKey: "AIzaSyC01cGmT1UQH-Nwzuo7Et0kmpa3ycKfSws",
        authDomain: "business-newspaper.firebaseapp.com",
        projectId: "business-newspaper",
        storageBucket: "business-newspaper.firebasestorage.app",
        messagingSenderId: "329604599970",
        appId: "1:329604599970:web:80e9e98dfa2e292443c7fb",
        measurementId: "G-VD95LBMDMS"
    };

    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // ===== DOM 요소 =====
    const authSection = document.getElementById('auth-section');
    const mainContent = document.getElementById('main-content');
    const authBtn = document.getElementById('auth-btn');
    const toggleAuth = document.getElementById('toggle-auth');
    const authTitle = document.getElementById('auth-title');
    const authMessage = document.getElementById('auth-message');

    const datePicker = document.getElementById('date-picker');
    const typeSelect = document.getElementById('type-select');
    const pageInput = document.getElementById('page-input');
    const img = document.getElementById('newspaper-img');
    const errorMsg = document.getElementById('error-msg');
    const pageInfo = document.getElementById('page-info');
    const goBtn = document.getElementById('go-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    const BASE_URL = "https://file2.mk.co.kr/mkde/";

    // ===== 인증 로직 =====
    let isSignup = false;

    toggleAuth.addEventListener('click', () => {
        isSignup = !isSignup;
        authTitle.textContent = isSignup ? '회원가입' : '로그인';
        authBtn.textContent = isSignup ? '회원가입' : '로그인';
    });

    authBtn.addEventListener('click', () => {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        if (!email || !password) {
            authMessage.textContent = '이메일과 비밀번호를 입력하세요.';
            authMessage.className = 'text-danger';
            return;
        }
        if (isSignup) {
            auth.createUserWithEmailAndPassword(email, password)
                .then(() => {
                    authMessage.textContent = '회원가입 성공!';
                    authMessage.className = 'text-success';
                })
                .catch(err => {
                    authMessage.textContent = err.message;
                    authMessage.className = 'text-danger';
                });
        } else {
            auth.signInWithEmailAndPassword(email, password)
                .then(() => {
                    authMessage.textContent = '로그인 성공!';
                    authMessage.className = 'text-success';
                })
                .catch(err => {
                    authMessage.textContent = err.message;
                    authMessage.className = 'text-danger';
                });
        }
    });

    document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());

    auth.onAuthStateChanged(user => {
        if (user) {
            authSection.style.display = 'none';
            mainContent.style.display = 'block';
            document.getElementById('user-email').textContent = user.email;
            document.getElementById('current-user').style.display = 'block';
            document.getElementById('logout-btn').style.display = 'block';
            document.querySelector('.controls').classList.remove('hidden');
            loadMemos(user.uid);
            loadPhotoSwipe();
            authMessage.textContent = `환영합니다, ${user.email}님!`;
            authMessage.className = 'text-success';
            setTimeout(() => authMessage.textContent = '', 3000);
        } else {
            authSection.style.display = 'block';
            mainContent.style.display = 'none';
            document.getElementById('logout-btn').style.display = 'none';
        }
    });

    // ===== 메모 기능 (편집 기능 추가) =====
    function getCurrentPageKey() {
        const date = datePicker.value.replace(/-/g, '');
        const page = pageInput.value;
        return `${date}_${page}`;
    }
    
    let editingIndex = -1;  // 현재 편집 중인 메모 인덱스 (-1 = 편집 중 아님)
    
    document.getElementById('save-memo').addEventListener('click', () => {
        const user = auth.currentUser;
        if (!user) {
            alert('로그인 후 사용하세요.');
            return;
        }
        const text = document.getElementById('memo-input').value.trim();
        if (!text) {
            alert('메모 내용을 입력하세요.');
            return;
        }
    
        const key = getCurrentPageKey();
        const timestamp = new Date().toLocaleString('ko-KR');
        const newMemo = { text, timestamp };
    
        db.collection('users').doc(user.uid).collection('memos').doc(key).get()
            .then(doc => {
                let memos = [];
                if (doc.exists && doc.data().memos) {
                    memos = doc.data().memos;
                }
    
                if (editingIndex >= 0) {
                    // 편집 모드: 기존 메모 수정
                    memos[editingIndex] = newMemo;
                    editingIndex = -1;
                    document.getElementById('save-memo').textContent = '메모 저장';
                } else {
                    // 새 메모 추가
                    memos.push(newMemo);
                }
    
                return db.collection('users').doc(user.uid).collection('memos').doc(key).set({
                    memos: memos
                });
            })
            .then(() => {
                document.getElementById('memo-input').value = '';
                alert(editingIndex >= 0 ? '메모가 수정되었습니다!' : '메모가 추가되었습니다!');
                loadMemos(user.uid);
            })
            .catch(err => {
                console.error('메모 저장 오류:', err);
                alert('저장 실패: ' + err.message);
            });
    });
    
    // 메모 로드 + 편집 버튼 추가
    function loadMemos(uid) {
        const key = getCurrentPageKey();
        document.getElementById('current-page-info').textContent = pageInfo.textContent;
    
        db.collection('users').doc(uid).collection('memos').doc(key).get()
            .then(doc => {
                const list = document.getElementById('memo-list');
                list.innerHTML = '';
                if (doc.exists && doc.data().memos && doc.data().memos.length > 0) {
                    let memos = doc.data().memos;
                    // 최신 메모 위로 정렬
                    memos = memos.slice().reverse();
    
                    memos.forEach((memo, reversedIndex) => {
                        const originalIndex = memos.length - 1 - reversedIndex;  // 원본 배열 인덱스
                        const div = document.createElement('div');
                        div.className = 'memo-item';
                        div.innerHTML = `
                            <strong>${memo.timestamp}</strong>
                            <p>${memo.text.replace(/\n/g, '<br>')}</p>
                            <button class="btn btn-sm btn-outline-primary edit-btn" data-index="${originalIndex}">편집</button>
                            <hr>
                        `;
                        list.appendChild(div);
                    });
    
                    // 편집 버튼 이벤트 위임
                    list.querySelectorAll('.edit-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const index = parseInt(e.target.dataset.index);
                            editingIndex = index;
    
                            // 원본 메모 배열 가져와서 입력창에 로드
                            db.collection('users').doc(uid).collection('memos').doc(key).get()
                                .then(doc => {
                                    if (doc.exists) {
                                        const originalMemos = doc.data().memos;
                                        const memoToEdit = originalMemos[index];
                                        document.getElementById('memo-input').value = memoToEdit.text;
                                        document.getElementById('save-memo').textContent = '수정 저장';
                                        document.getElementById('memo-input').focus();
                                    }
                                });
                        });
                    });
                } else {
                    list.innerHTML = '<p class="text-muted">아직 메모가 없습니다.</p>';
                }
            })
            .catch(err => {
                console.error('메모 로드 오류:', err);
                document.getElementById('memo-list').innerHTML = '<p class="text-danger">메모 로드 실패</p>';
            });
    }

    // ===== PhotoSwipe 관련 (완벽 수정 버전) =====
    let lightbox = null;
    let photoSwipeLoaded = false;  // 로드 상태 추적

    function initPhotoSwipe() {
        if (lightbox) {
            lightbox.destroy();
            lightbox = null;
        }

        const galleryEl = document.getElementById('single-gallery');
        if (!galleryEl || !window.PhotoSwipe || !photoSwipeLoaded) {
            // PhotoSwipe가 아직 로드되지 않았으면 기다림
            return;
        }

        lightbox = new PhotoSwipe({
            gallery: galleryEl,
            children: 'a',
            pswpModule: PhotoSwipe,
            bgOpacity: 0.95,
            showHideOpacity: true,
            wheelToZoom: true,
            pinchToClose: true,
            tapAction: 'toggle-controls'
        });
        lightbox.init();
    }

    // PhotoSwipe 스크립트 동적 로드 (로드 성공/실패 처리 강화)
    function loadPhotoSwipe() {
        if (photoSwipeLoaded || window.PhotoSwipe) {
            photoSwipeLoaded = true;
            initPhotoSwipe();
            return;
        }

        // 중복 로드 방지
        if (document.querySelector('script[src*="photoswipe.umd.min.js"]')) {
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/photoswipe@5.4.4/dist/photoswipe.esm.min.js';
        script.onload = () => {
            console.log('PhotoSwipe 성공적으로 로드됨');
            photoSwipeLoaded = true;
            initPhotoSwipe();
        };
        script.onerror = () => {
            console.error('PhotoSwipe 로드 실패 - 네트워크 또는 CDN 문제');
            alert('이미지 확대 기능을 로드하지 못했습니다. 인터넷 연결을 확인해 주세요.');
        };
        document.head.appendChild(script);  // head에 추가 (더 안정적)
    }

    // ===== 신문 보기 로직 (항상 한쪽 보기) =====
    function generateUrl(pageNum) {
        const dateVal = datePicker.value;
        if (!dateVal) return null;
        const [year, month, day] = dateVal.split('-');
        const type = typeSelect.value;
        const page = String(pageNum).padStart(2, '0');
        return `${BASE_URL}${year}/${month}/${day}/page/${type}_${page}_ORG.jpg`;
    }

    function updateImage() {
        const dateVal = datePicker.value;
        if (!dateVal) return;

        const pageNum = parseInt(pageInput.value);
        img.src = generateUrl(pageNum);
        pageInfo.textContent = `${dateVal.replace(/-/g, '.')} | ${typeSelect.options[typeSelect.selectedIndex].text} ${pageNum}면`;

        document.getElementById('single-link').href = img.src;

        errorMsg.style.display = 'none';
        if (auth.currentUser) loadMemos(auth.currentUser.uid);

        // PhotoSwipe href 업데이트
        document.getElementById('single-link').href = img.src;

        // PhotoSwipe 초기화 (로드 보장)
        loadPhotoSwipe();  // 이 함수가 로드 여부 판단하고 초기화
    }

    // ===== 이벤트 리스너 =====
    datePicker.addEventListener('change', () => { pageInput.value = 1; updateImage(); });
    typeSelect.addEventListener('change', () => { pageInput.value = 1; updateImage(); });
    goBtn.addEventListener('click', updateImage);
    pageInput.addEventListener('input', () => { if (pageInput.value < 1) pageInput.value = 1; updateImage(); });
    pageInput.addEventListener('keydown', e => { if (e.key === 'Enter') updateImage(); });

    prevBtn.addEventListener('click', () => {
        if (parseInt(pageInput.value) > 1) {
            pageInput.value = parseInt(pageInput.value) - 1;
            updateImage();
        }
    });

    nextBtn.addEventListener('click', () => {
        pageInput.value = parseInt(pageInput.value) + 1;
        updateImage();
    });

    // ===== 이미지 에러 처리 =====
    img.onerror = () => handleImageError();

    function handleImageError() {
        const currentPage = parseInt(pageInput.value);

        if (currentPage === 1 && typeSelect.value === '01') {
            const currentDate = new Date(datePicker.value);
            currentDate.setDate(currentDate.getDate() - 1);

            const yyyy = currentDate.getFullYear();
            const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
            const dd = String(currentDate.getDate()).padStart(2, '0');
            const newDateStr = `${yyyy}-${mm}-${dd}`;

            const today = new Date();
            const maxBackDate = new Date(today);
            maxBackDate.setDate(today.getDate() - 7);
            if (currentDate < maxBackDate) {
                alert("최근 7일 내에 A타입 신문이 존재하지 않습니다.");
                errorMsg.style.display = 'block';
                img.src = '';
                return;
            }

            datePicker.value = newDateStr;
            alert("오늘 신문이 없습니다. 전날 신문으로 이동합니다: " + newDateStr.replace(/-/g, '.'));
            updateImage();
            return;
        }

        if (currentPage === 1 && typeSelect.value !== '01') {
            alert("해당 타입의 신문이 존재하지 않습니다.\n기본 타입(A타입)으로 전환합니다.");
            typeSelect.value = '01';
            pageInput.value = 1;
            updateImage();
            return;
        }

        alert("해당 페이지가 존재하지 않습니다.");
        if (currentPage > 1) {
            pageInput.value = currentPage - 1;
            updateImage();
        } else {
            errorMsg.style.display = 'block';
            img.src = '';
        }
    }

    img.onload = () => { errorMsg.style.display = 'none'; };

    // ===== 페이지 넘김 클릭 영역 =====
    document.querySelectorAll('.click-left, .click-right').forEach(area => {
        area.addEventListener('touchstart', e => {
            if (e.touches.length >= 2) return;
            e.preventDefault();
            if (area.classList.contains('click-left')) prevBtn.click();
            else nextBtn.click();
        }, { passive: false });

        area.addEventListener('click', e => {
            e.preventDefault();
            if (area.classList.contains('click-left')) prevBtn.click();
            else nextBtn.click();
        });
    });

    // ===== 길게 누르기 토글 (controls만) =====
    let longPressTimer = null;
    const LONG_PRESS_DURATION = 600;

    function toggleControls() {
        const controls = document.querySelector('.controls');
        controls.classList.toggle('hidden');
        if (navigator.vibrate) navigator.vibrate(50);
    }

    function startLongPress() {
        cancelLongPress();
        longPressTimer = setTimeout(toggleControls, LONG_PRESS_DURATION);
    }

    function cancelLongPress() {
        if (longPressTimer) clearTimeout(longPressTimer);
        longPressTimer = null;
    }

    document.body.addEventListener('mousedown', e => {
        if (e.button === 0 && !e.target.classList.contains('click-left') && !e.target.classList.contains('click-right')) {
            startLongPress();
        }
    });
    document.body.addEventListener('mouseup', cancelLongPress);
    document.body.addEventListener('mouseleave', cancelLongPress);
    document.body.addEventListener('mousemove', cancelLongPress);

    document.body.addEventListener('touchstart', e => {
        if (!e.target.classList.contains('click-left') && !e.target.classList.contains('click-right')) {
            startLongPress();
        }
    }, { passive: false });
    document.body.addEventListener('touchend', cancelLongPress);
    document.body.addEventListener('touchcancel', cancelLongPress);
    document.body.addEventListener('touchmove', cancelLongPress, { passive: false });

    // ===== 모바일 전체 화면 스와이프 페이지 넘김 (PC 클릭 유지) =====
    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 50;  // 스와이프 인식 최소 거리 (px)
    
    const viewer = document.getElementById('viewer');  // 뷰어 전체 영역
    
    viewer.addEventListener('touchstart', e => {
        if (e.touches.length > 1) return;  // 핀치 줌 무시
        touchStartX = e.touches[0].clientX;
    }, { passive: true });
    
    viewer.addEventListener('touchmove', e => {
        // 터치 이동 중 (옵션: 약간의 드래그 허용)
    }, { passive: true });
    
    viewer.addEventListener('touchend', e => {
        if (e.changedTouches.length === 0) return;
        touchEndX = e.changedTouches[0].clientX;
    
        const deltaX = touchStartX - touchEndX;  // 양수: 왼쪽 스와이프, 음수: 오른쪽 스와이프
    
        // 확대 상태(PhotoSwipe 갤러리 안)에서는 스와이프 무시 → PhotoSwipe에 넘김
        const scale = window.visualViewport ? window.visualViewport.scale : 1;
        if (scale > 1.1) return;
    
        if (Math.abs(deltaX) > swipeThreshold) {
            if (deltaX > 0) {
                // 왼쪽 스와이프 → 다음 페이지
                nextBtn.click();
            } else {
                // 오른쪽 스와이프 → 이전 페이지
                prevBtn.click();
            }
        }
    }, { passive: true });

    // 기존 좌우 클릭 영역은 PC/모바일 짧은 탭용으로 그대로 유지 (충돌 없음)
    
    // 초기 로드: 오늘 날짜 강제 설정 (한국 시간 기준)
    const today = new Date();

    // 한국 시간(KST)으로 정확히 맞추기 (UTC+9)
    const kstOffset = 9 * 60; // 9시간 (분 단위)
    const kstDate = new Date(today.getTime() + kstOffset * 60 * 1000);

    const yyyy = kstDate.getFullYear();
    const mm = String(kstDate.getMonth() + 1).padStart(2, '0');
    const dd = String(kstDate.getDate()).padStart(2, '0');

    datePicker.value = `${yyyy}-${mm}-${dd}`;

    typeSelect.value = '01';
    pageInput.value = 1;
    updateImage();

});

