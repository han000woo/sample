import { defineStore } from 'pinia';
import api from '../api/client'; // 실제 API 클라이언트 임포트
import router from '../router'; // 라우터 임포트

// (Model - Pinia Store)
export const useAuthStore = defineStore('auth', {
  state: () => ({
    isLoggedIn: false,
    currentUser: null, // 사용자 이름 또는 사용자 객체
    accessToken: localStorage.getItem('access_token') || null,
    refreshToken: localStorage.getItem('refresh_token') || null,
  }),

  actions: {
    async login(username, password) {
      try {
        // (실제 JWT 로직)
        // FastAPI /auth/token 엔드포인트는 form-data를 기대합니다.
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await api.post('/auth/token', formData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const { access_token, refresh_token, username: responseUsername } = response.data;

        // 토큰을 localStorage에 저장
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        
        // Pinia 상태 업데이트
        this.accessToken = access_token;
        this.refreshToken = refresh_token;
        this.isLoggedIn = true;
        this.currentUser = responseUsername;

        // API 클라이언트의 기본 헤더 설정 (선택 사항, 인터셉터가 이미 처리함)
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

        return true;

      } catch (error) {
        console.error("로그인 실패:", error);
        this.logout(); // 실패 시 혹시 모를 잔여 데이터 정리
        return false;
      }
    },

    // [신규] Signup 액션
    async signup(username, email,password) {
      
      try {
        const response = await api.post('/users/', {
          username: username,
          email: email,
          password: password,
          is_active: true // UserCreate 스키마에 따라
        });
        
        // 성공 시 (201 CREATED), response.data에 UserRead 스키마 반환
        return response.data;

      } catch (error) {
        // 400 Bad Request (이미 존재하는 사용자) 등
        const detail = error.response?.data?.detail || '알 수 없는 오류가 발생했습니다.';
        throw new Error(detail);
      }
    },
    logout() {
      // (실제 JWT 로직)
      // localStorage에서 토큰 제거
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      // Pinia 상태 초기화
      this.isLoggedIn = false;
      this.currentUser = null;
      this.accessToken = null;
      this.refreshToken = null;

      // API 클라이언트 헤더 제거
      delete api.defaults.headers.common['Authorization'];

      // 라우터가 /login으로 리디렉션하도록 보장
      // (라우터 가드가 처리할 수도 있지만, 명시적으로 호출)
      if (router.currentRoute.value.path !== '/login') {
          router.push('/login');
      }
    },

    // (신규) 앱 로드 시 토큰 유효성 검사
    async checkAuthOnLoad() {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          // (선택적) /auth/me 엔드포인트로 토큰 유효성 검사 및 유저 정보 갱신
          // 인터셉터가 토큰을 헤더에 자동으로 추가해 줍니다.
          const response = await api.get('/auth/me'); 
          
          this.isLoggedIn = true;
          this.currentUser = response.data.username; // /me가 UserRead 스키마 반환
          this.accessToken = token;
          this.refreshToken = localStorage.getItem('refresh_token');

        } catch (error) {
          // /me 호출 실패 (토큰 만료 등) -> 인터셉터가 재발급 시도
          // 재발급조차 실패하면 인터셉터가 logout을 호출할 수 있음
          // (혹은 여기서 logout을 명시적으로 호출)
          if (error.response?.status === 401) {
             // 인터셉터가 로그아웃을 처리하므로 여기서는 대기
             // 만약 인터셉터가 로그아웃을 처리하지 않는다면, 여기서 this.logout() 호출
             console.log("토큰 갱신 시도 중이거나 실패했습니다.");
             // this.logout(); // 인터셉터의 로직에 따라 결정
          }
        }
      } else {
        this.isLoggedIn = false;
      }
    },

    // (신규) 인터셉터가 새 토큰을 받았을 때 호출
    setAccessToken(token) {
      this.accessToken = token;
      localStorage.setItem('access_token', token);
    }
  },
});