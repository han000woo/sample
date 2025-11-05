const apiBase = "http://localhost:8000/api/v1";
export function setupAuthModal() {
    const authStatus = document.getElementById('auth-status');
    const modal = document.getElementById('auth-modal');
    const closeBtn = document.getElementById('close-modal');
    const title = document.getElementById('modal-title');
    const usernameInput = document.getElementById('modal-username');
    const passwordInput = document.getElementById('modal-password');
    const emailInput = document.getElementById('modal-email')
    const confirmInput = document.getElementById('modal-confirm-password');
    const submitBtn = document.getElementById('modal-submit');
    const switchText = document.getElementById('modal-switch-text');
    const switchBtn = document.getElementById('modal-switch-btn');

    let mode = 'login'; // login | register

    // 상태 렌더링
    function renderAuthStatus() {
        authStatus.innerHTML = '';
        const token = localStorage.getItem('access_token')?.trim();
        const username = localStorage.getItem('username')
        if (token) {
            const welcome = document.createElement('span');

        
            welcome.innerHTML = `환영합니다, <strong class="text-gray-900">${username}</strong>님!`;
            welcome.className = 'mr-4 px-3 py-1 border border-gray-500 rounded text-gray-800 font-medium';



            // 전체 컨테이너를 더 직관적인 클래스로 변경
            welcome.className = 'inline-flex items-center'; // flex와 inline-flex를 조합하여 깔끔하게 배치

            const logoutBtn = document.createElement('button');
            logoutBtn.textContent = '로그아웃';
            logoutBtn.className = 'px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600';
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('access_token');
                renderAuthStatus();
            });

            authStatus.appendChild(welcome);
            authStatus.appendChild(logoutBtn);
        } else {
            const loginBtn = document.createElement('button');
            loginBtn.textContent = '로그인';
            loginBtn.className = 'px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600';
            loginBtn.addEventListener('click', () => openModal('login'));

            const registerBtn = document.createElement('button');
            registerBtn.textContent = '회원가입';
            registerBtn.className = 'ml-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600';
            registerBtn.addEventListener('click', () => openModal('register'));

            authStatus.appendChild(loginBtn);
            authStatus.appendChild(registerBtn);
        }
    }

    // 모달 열기
    function openModal(newMode) {
        mode = newMode;
        modal.classList.remove('hidden');
        usernameInput.value = '';
        passwordInput.value = '';
        confirmInput.value = '';
        if (mode === 'login') {
            title.textContent = '로그인';
            confirmInput.classList.add('hidden');
            switchText.textContent = '계정이 없으신가요?';
            switchBtn.textContent = '회원가입';
        } else {
            title.textContent = '회원가입';
            confirmInput.classList.remove('hidden');
            emailInput.classList.remove('hidden');
            switchText.textContent = '이미 계정이 있으신가요?';
            switchBtn.textContent = '로그인';
        }
    }

    // 모달 닫기
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

    // 모달 전환
    switchBtn.addEventListener('click', () => {
        openModal(mode === 'login' ? 'register' : 'login');
    });

    // 제출
    submitBtn.addEventListener('click', async () => {
        const username = usernameInput.value;
        const password = passwordInput.value;
        const email = emailInput.value;
        const confirm = confirmInput.value;

        try {
            if (mode === 'login') {
                // form-data 형식으로 전송
                const formData = new URLSearchParams();
                formData.append('username', username);
                formData.append('password', password);

                const res = await fetch(`${apiBase}/auth/token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData.toString()
                });

                if (!res.ok) throw new Error('로그인 실패');

                const data = await res.json();

                localStorage.setItem('username', data.username);
                localStorage.setItem('access_token', data.access_token.trim());
                localStorage.setItem('refresh_token', data.refresh_token.trim());
                renderAuthStatus();
                modal.classList.add('hidden');

            } else {
                // 회원가입
                if (password !== confirm) {
                    alert('비밀번호가 일치하지 않습니다!');
                    return;
                }
                const res = await fetch(`${apiBase}/users/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password, email })
                });
                if (!res.ok) throw new Error('회원가입 실패');
                alert('회원가입이 완료되었습니다!');
                openModal('login'); // 회원가입 후 로그인 모드로 전환
            }
        } catch (err) {
            alert(err.message);
        }
    });


    renderAuthStatus();
}
