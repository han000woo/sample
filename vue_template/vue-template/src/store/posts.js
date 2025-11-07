import { ref } from "vue";

// 1. ref로 반응성을 가지는 데이터 배열 생성
export const posts = ref([
  { id: 1, title: 'Vue 3 스근하게 시작하기', author: '제미니', content: 'Vite와 Vue 3는 정말 빠릅니다.' },
  { id: 2, title: '게시판 데이터 관리', author: 'AI', content: 'ref를 사용하면 간단하게 상태 관리가 가능해요.' },
]);

// 2. 글을 추가하는 함수
export function addPost(post) {
  const newId = posts.value.length > 0 ? Math.max(...posts.value.map(p => p.id)) + 1 : 1;
  posts.value.push({ ...post, id: newId });
}

// 3. ID로 글을 찾는 함수
export function getPostById(id) {
  // 라우터 파라미터는 문자열일 수 있으니 숫자로 변환
  return posts.value.find(p => p.id === parseInt(id));
}