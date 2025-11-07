<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { getPostById } from '@/store/posts.js'; // 1. ID로 글 찾는 함수 가져오기

const route = useRoute(); // 2. 현재 라우트 정보 (파라미터 포함)
const post = ref(null); // 3. 글 데이터를 담을 변수

// 4. 컴포넌트 마운트 시 URL의 :id 파라미터로 글 찾기
onMounted(() => {
  const postId = route.params.id;
  post.value = getPostById(postId);
});
</script>

<template>
  <div class="board-detail">
    <div v-if="post">
      <h2>{{ post.title }}</h2>
      <p><strong>작성자:</strong> {{ post.author }}</p>
      <hr>
      <div class="content">
        <p v-html="post.content.replace(/\n/g, '<br>')"></p>
      </div>
    </div>
    <div v-else>
      <p>게시글을 찾을 수 없습니다.</p>
    </div>
    <hr>
    <RouterLink to="/">목록으로 돌아가기</RouterLink>
  </div>
</template>

<style scoped>
.board-detail { max-width: 800px; margin: 0 auto; }
.content { min-height: 200px; padding: 10px; }
</style>