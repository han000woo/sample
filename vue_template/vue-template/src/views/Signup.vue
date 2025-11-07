<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 1. v-model로 연결할 데이터
const username = ref('');
const password = ref('');
const passwordConfirm = ref('');

// 2. 회원가입 버튼 클릭 시 실행될 함수
async function handleSignup() {
  if (!username.value || !password.value) {
    alert('아이디와 비밀번호를 모두 입력해주세요.');
    return;
  }

  if (password.value !== passwordConfirm.value) {
    alert('비밀번호가 일치하지 않습니다.');
    return;
  }
  
  try {
    console.log('회원가입 시도:', username.value);
    
    // ---------------------------------------------------
    // (B) TODO: 여기에 실제 회원가입 API 호출 코드를 넣습니다.
    // 예: const res = await api.post('/signup', { ... });
    // (이전 답변의 `src/services/api.js`를 사용)
    // ---------------------------------------------------

    // (임시) 성공했다고 가정
    alert('회원가입 성공! 로그인 페이지로 이동합니다.');

    // 3. 회원가입 성공 시 로그인 페이지로 이동
    router.push('/login'); 

  } catch (error) {
    console.error('회원가입 실패:', error);
    alert('회원가입에 실패했습니다. (예: 이미 사용 중인 아이디)');
  }
}
</script>

<template>
  <div class="auth-form">
    <h2>회원가입</h2>
    <form @submit.prevent="handleSignup">
      <div class="form-group">
        <label for="username">사용할 아이디:</label>
        <input type="text" id="username" v-model="username" required>
      </div>
      <div class="form-group">
        <label for="password">비밀번호:</label>
        <input type="password" id="password" v-model="password" required>
      </div>
      <div class="form-group">
        <label for="password-confirm">비밀번호 확인:</label>
        <input type="password" id="password-confirm" v-model="passwordConfirm" required>
      </div>
      <button type="submit">회원가입</button>
    </form>
  </div>
</template>

<style scoped>
/* 로그인 폼과 동일한 스타일 시트 사용 */
.auth-form {
  max-width: 400px;
  margin: 40px auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
}
.form-group input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}
button {
  width: 100%;
}
</style>