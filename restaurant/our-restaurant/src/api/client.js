import axios from 'axios';
import { useAuthStore } from '../store/auth';

const api = axios.create({
  // baseURL: 'http://172.20.144.1:8000/api/v1', // 서버 LAN IP 사용
  baseURL: "http://localhost:8000/api/v1",
  timeout: 10000,
});



/**
 * [요청 인터셉터]
 * 모든 API 요청을 보내기 전, Pinia 스토어에서 Access Token을 가져와
 * 'Authorization' 헤더에 추가합니다.
 */
api.interceptors.request.use(
  (config) => {
    // 라우터가 준비되기 전이나, 스토어 로딩 전에 호출될 수 있으므로
    // useAuthStore()는 인터셉터 내부에서 호출합니다.
    const authStore = useAuthStore();
    const token = authStore.accessToken;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * [응답 인터셉터]
 * API 응답을 받았을 때, 401 Unauthorized 에러를 감지합니다.
 * Access Token이 만료된 경우(401), Refresh Token으로 새 토큰을 발급받고
 * 실패했던 원래 요청을 재시도합니다.
 */

// 토큰 갱신 중임을 나타내는 플래그
let isRefreshing = false; 
// 토큰 갱신 동안 실패한 요청들을 저장하는 큐
let failedQueue = []; 

/**
 * 갱신이 완료된 후, 대기 중이던 요청들을 처리합니다.
 * @param {Error | null} error - 갱신 실패 시 에러 객체
 * @param {string | null} token - 새로 발급된 엑세스 토큰
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error); // 갱신 실패 시, 대기 중이던 모든 요청 실패 처리
    } else {
      prom.resolve(token); // 갱신 성공 시, 새 토큰으로 요청 재시도
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    // 2xx 응답은 그대로 통과
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const authStore = useAuthStore();

    // 401 에러이고, 
    // 재시도 요청이 아니며(무한 루프 방지),
    // 토큰 갱신 요청 자체가 실패한 것이 아닐 때
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/api/v1/auth/refresh') {
      
      if (isRefreshing) {
        // 이미 다른 요청이 토큰 갱신을 시도 중인 경우, 큐에 대기
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest); // 원래 요청 재시도
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      // 이 요청이 첫 번째 401일 때, 토큰 갱신 시도
      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = authStore.refreshToken;
      if (!refreshToken) {
        // Refresh Token이 없으면 그냥 로그아웃 처리
        isRefreshing = false;
        authStore.logout();
        return Promise.reject(error);
      }

      try {
        // [수정] 토큰 갱신 요청 API 경로 확인
        // 이 요청은 인터셉터를 타지 않도록 별도 axios 인스턴스를 사용할 수 있으나,
        // 여기서는 baseURL이 없는 기본 axios를 사용합니다.
        const response = await axios.post('/api/v1/auth/refresh', {
          refresh_token: refreshToken
        });
        
        const newAccessToken = response.data.access_token;
        
        // 1. 스토어와 axios 인스턴스 기본 헤더에 새 토큰 저장
        authStore.setAccessToken(newAccessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        
        // 2. 현재 실패한 원래 요청 헤더에도 새 토큰 저장
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        
        // 3. 큐에 대기 중이던 다른 요청들 실행
        processQueue(null, newAccessToken);
        
        // 4. 실패했던 원래 요청 재시도
        return api(originalRequest);

      } catch (refreshError) {
        // Refresh Token마저 만료/실패한 경우
        processQueue(refreshError, null);
        authStore.logout(); // 강제 로그아웃
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 401 에러가 아니거나, 재시도 조건이 안 맞으면 그냥 에러 반환
    return Promise.reject(error);
  }
);

export default api;