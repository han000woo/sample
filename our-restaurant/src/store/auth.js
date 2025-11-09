import { defineStore } from "pinia";
import { login as apiLogin } from "@/api/mockApi";

// (Model - Pinia Store)
// 'auth' 스토어 정의
export const useAuthStore = defineStore('auth', {
    // 상태 (State)
    state: () => ({
        isLoggedIn: false,
        currentUser: null,
    }),

    // 뷰모델 (Actions)
    actions: {
        async login(username, password) {
            try {
                // (실제 JWT 로직)
                // 1. apiLogin 호출
                // 2. 응답으로 { accessToken, user } 받기
                // 3. accessToken을 localStorage에 저장
                // 4. this.isLoggedIn = true, this.currentUser = user.name

                const user = await apiLogin(username, password); // Mock API 호출
                this.isLoggedIn = true;
                this.currentUser = user.username;

                // 실제 앱에서는 여기에 localStorage.setItem('token', user.token) 등이 들어감

                return true;
            } catch (error) {
                console.error(error);
                return false;
            }
        },

        logout() {
            // (실제 JWT 로직)
            // 1. localStorage에서 accessToken 제거
            // 2. this.isLoggedIn = false, this.currentUser = null

            this.isLoggedIn = false;
            this.currentUser = null;
            // localStorage.removeItem('token')
        },
    },
});