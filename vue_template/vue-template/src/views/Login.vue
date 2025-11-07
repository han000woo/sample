<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 1. v-model로 연결할 데이터
const username = ref('');
const password = ref('');

// 2. 로그인 버튼 클릭 시 실행될 함수
async function handleLogin() {
  if (!username.value || !password.value) {
    alert('아이디와 비밀번호를 모두 입력해주세요.');
    return;
  }
  
  try {
    console.log('로그인 시도:', username.value, password.value);
    
    // ---------------------------------------------------
    // (A) TODO: 여기에 실제 로그인 API 호출 코드를 넣습니다.
    // 예: const res = await api.post('/login', { ... });
    // (이전 답변의 `src/services/api.js`를 사용)
    // ---------------------------------------------------
    
    // (임시) 성공했다고 가정
    alert('로그인 성공!');
    
    // (A) TODO: 토큰 저장 로직 (이전 답변 참고)
    // localStorage.setItem('accessToken', res.data.accessToken);
    // localStorage.setItem('refreshToken', res.data.refreshToken);

    // 3. 로그인 성공 시 홈(게시판 목록)으로 이동
    router.push('/'); 

  } catch (error) {
    console.error('로그인 실패:', error);
    alert('로그인에 실패했습니다. 아이디와 비밀번호를 확인하세요.');
  }
}
</script>

<template>
  <div class="auth-form">
    <h2>로그인</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="username">아이디:</label>
        <input type="text" id="username" v-model="username" required>
      </div>
      <div class="form-group">
        <label for="password">비밀번호:</label>
        <input type="password" id="password" v-model="password" required>
      </div>
      <button type="submit">로그인</button>
    </form>
  </div>
</template>

<style scoped>
/* 회원가입과 공통 스타일을 사용 */
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
  box-sizing: border-box; /* 패딩 포함 너비 100% */
}
button {
  width: 100%;
}
</style>