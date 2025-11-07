<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { addPost } from '@/store/posts.js'; // 1. 스토어에서 'addPost' 함수 가져오기

const router = useRouter(); // 2. 페이지 이동을 위한 라우터

// 3. v-model로 연결할 반응형 데이터
const newPost = ref({
  title: '',
  author: '',
  content: '',
});

// 4. 폼 제출 시 실행될 함수
function handleSubmit() {
  if (!newPost.value.title || !newPost.value.content) {
    alert('제목과 내용을 입력해주세요.');
    return;
  }
  
  addPost(newPost.value); // 5. 스토어에 새 글 추가
  router.push('/'); // 6. 목록 페이지로 이동
}
</script>

<template>
  <div class="board-write">
    <h2>새 글 작성</h2>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="title">제목:</label>
        <input type="text" id="title" v-model="newPost.title">
      </div>
      <div class="form-group">
        <label for="author">작성자:</label>
        <input type="text" id="author" v-model="newPost.author">
      </div>
      <div class="form-group">
        <label for="content">내용:</label>
        <textarea id="content" v-model="newPost.content" rows="10"></textarea>
      </div>
      <button type="submit">등록</button>
      <RouterLink to="/">취소</RouterLink>
    </form>
  </div>
</template>

<style scoped>
.board-write { max-width: 600px; margin: 0 auto; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; }
.form-group input, .form-group textarea {
  width: 100%;
  padding: 8px;
  box-sizing: border-box; /* 패딩 포함해서 너비 100% */
}
button { margin-right: 10px; }
</style>