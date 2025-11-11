<template>
    <!-- (View) -->
    <div class="flex items-center justify-center h-full">
        <div class="w-full max-w-md p-8 bg-white rounded-lg shadow-xl">
            <h2 class="text-3xl font-bold text-center text-blue-600 mb-6">맛집 지도</h2>
            <form @submit.prevent="handleLogin">
                <div class="mb-4">
                    <label for="username" class="block text-sm font-medium text-gray-700 mb-2">아이디</label>
                    <input type="text" id="username" v-model="loginForm.username"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="gkstjsdn0011">
                </div>
                <div class="mb-6">
                    <label for="password" class="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
                    <input type="password" id="password" v-model="loginForm.password"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="wintop0410@">
                </div>
                <p v-if="errorMessage" class="text-red-500 text-sm mb-4 text-center">{{ errorMessage }}</p>
                <button type="submit"
                    class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition duration-300">
                    로그인
                </button>
                <p class="text-sm text-gray-500 mt-4 text-center">
                  계정이 없으신가요?
                  <router-link to="/signup" class="text-blue-600 hover:underline">회원가입</router-link>
               </p>
                <p class="text-xs text-gray-500 mt-4 text-center">
                    (Mock: 'user' / 'pass1234')
                </p>
            </form>
        </div>
    </div>
</template>

<script setup>
// (ViewModel)
import { reactive, ref, inject } from 'vue'; // inject 삭제
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth'; // Pinia 스토어 임포트

const loginForm = reactive({
    username: 'gkstjsdn0011',
    password: 'wintop0410@'
});
const errorMessage = ref('');

// const store = inject('store'); // main.js에서 provide한 스토어 주입 (삭제)
const authStore = useAuthStore(); // 스토어 훅 사용
const router = useRouter(); // 라우터 사용

const handleLogin = async () => {
    errorMessage.value = ''; // 에러 메시지 초기화

    // (ViewModel이 Model의 메서드를 호출)
    const success = await authStore.login(loginForm.username, loginForm.password);

    if (success) {
        // 로그인 성공 시 Home으로 이동
        router.push('/');
    } else {
        // 로그인 실패
        errorMessage.value = '아이디 또는 비밀번호가 틀립니다.';
    }
};
</script>