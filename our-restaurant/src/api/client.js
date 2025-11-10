import axios from 'axios';
import { useAuthStore } from '../store/auth';

// FastAPI 서버 주소 (환경에 맞게 변경)
const baseURL = 'http://127.0.0.1:8000/api/v1/'; 

const api = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// --- 1. 요청 인터셉터 ---
// 요청을 보내기 전에 Access Token을 헤더에 추가합니다.
api.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore(); // 스토어 접근
        const token = localStorage.getItem('access_token');
        
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- 2. 응답 인터셉터 ---
// 401 에러(토큰 만료) 시 Refresh Token으로 새 토큰을 발급받습니다.
let isRefreshing = false; // 중복 재발급 요청 방지 플래그
let failedQueue = []; // 401로 실패한 요청 저장 큐

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => {
        // 성공적인 응답은 그대로 반환
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        const authStore = useAuthStore();

        // 401 에러이고, 재시도 요청이 아닌 경우
        if (error.response?.status === 401 && !originalRequest._retry) {
            
            if (isRefreshing) {
                // 이미 토큰 재발급이 진행 중인 경우, 큐에 대기
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true; // 재시도 플래그
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) {
                authStore.logout(); // 리프레시 토큰 없으면 로그아웃
                return Promise.reject(error);
            }

            try {
                // FastAPI /auth/refresh 엔드포인트 호출
                const rs = await axios.post(`${baseURL}/auth/refresh`, {
                    refresh_token: refreshToken
                });

                const newAccessToken = rs.data.access_token;
                
                // 새 토큰 저장
                localStorage.setItem('access_token', newAccessToken);
                authStore.setAccessToken(newAccessToken); // (스토어 상태도 업데이트 - auth.js에 추가 필요)

                // axios 기본 헤더 및 실패했던 원래 요청 헤더 업데이트
                api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

                // 대기 중이던 큐의 모든 요청 처리
                processQueue(null, newAccessToken);
                
                // 원래 요청 재시도
                return api(originalRequest);

            } catch (_error) {
                // 리프레시 토큰조차 만료되거나 유효하지 않은 경우
                processQueue(_error, null);
                authStore.logout(); // 강제 로그아웃
                return Promise.reject(_error);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;