<script setup>
import { posts } from '@/store/posts.js'; // 1. 스토어에서 데이터 가져오기
import { RouterLink } from 'vue-router'; // 2. 링크를 위한 RouterLink
</script>

<template>
  <div class="board-list">
    <h2>게시판 목록</h2>
    <RouterLink to="/write" class="write-button">글쓰기</RouterLink>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>제목</th>
          <th>작성자</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="post in posts" :key="post.id">
          <td>{{ post.id }}</td>
          <td>
            <RouterLink :to="`/post/${post.id}`">{{ post.title }}</RouterLink>
          </td>
          <td>{{ post.author }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* 간단한 스타일 */
.board-list { max-width: 800px; margin: 0 auto; }
.write-button { float: right; margin-bottom: 10px; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #ddd; padding: 8px; }
th { background-color: #f4f4f4; }
</style>