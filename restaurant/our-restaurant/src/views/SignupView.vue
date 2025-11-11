<template>
  <!-- (View) -->
  <div class="flex items-center justify-center h-full">
    <div class="w-full max-w-md p-8 bg-white rounded-lg shadow-xl">
      <h2 class="text-3xl font-bold text-center text-blue-600 mb-6">회원가입</h2>
      <form @submit.prevent="handleSubmit">
        <div class="mb-4">
          <label for="username" class="block text-sm font-medium text-gray-700 mb-2">아이디</label>
          <input
            type="text"
            id="username"
            v-model="signupForm.username"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="사용할 아이디"
          />
        </div>
        <div class="mb-4">
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">이메일</label>
          <input
            type="email"
            id="email"
            v-model="signupForm.email"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="사용할 아이디"
          />
        </div>
        <div class="mb-4">
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
          <input
            type="password"
            id="password"
            v-model="signupForm.password"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="비밀번호"
          />
        </div>
        <div class="mb-6">
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">비밀번호 확인</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="signupForm.confirmPassword"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="비밀번호 확인"
          />
        </div>
        <p v-if="errorMessage" class="text-red-500 text-sm mb-4 text-center">{{ errorMessage }}</p>
        <button
          type="submit"
          class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
        >
          회원가입
        </button>
        <p class="text-sm text-gray-500 mt-4 text-center">
          이미 계정이 있으신가요?
          <router-link to="/login" class="text-blue-600 hover:underline">로그인</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
// (ViewModel)
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';

const signupForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
});
const errorMessage = ref('');

const authStore = useAuthStore();
const router = useRouter();

const handleSubmit = async () => {
  errorMessage.value = '';

  // 1. 비밀번호 확인
  if (signupForm.password !== signupForm.confirmPassword) {
    errorMessage.value = '비밀번호가 일치하지 않습니다.';
    return;
  }

  // 2. 스토어의 signup 액션 호출
  try {
    const response = await authStore.signup(signupForm.username, signupForm.email, signupForm.password);
    
    // 3. 성공 시 로그인 페이지로 이동
    alert('회원가입에 성공했습니다! 로그인 페이지로 이동합니다.');
    router.push('/login');

  } catch (error) {
    // 4. 실패 시 에러 메시지 표시
    errorMessage.value = error.message || '회원가입에 실패했습니다. (서버 오류)';
  }
};
</script>