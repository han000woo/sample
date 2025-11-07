import { createRouter, createWebHistory } from 'vue-router';

// 나중에 생성할 컴포넌트들을 미리 import 합니다.
import BoardList from '@/views/BoardList.vue';
import BoardDetail from '@/views/BoardDetail.vue';
import BoardWrite from '@/views/BoardWrite.vue';
import Login from '@/views/Login.vue';
import Signup from '@/views/Signup.vue';

const routes = [
  {
    path: '/',
    name: 'BoardList',
    component: BoardList,
  },
  {
    path: '/post/:id', // :id 로 동적 파라미터 받기
    name: 'BoardDetail',
    component: BoardDetail,
  },
  {
    path: '/write',
    name: 'BoardWrite',
    component: BoardWrite,
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/signup',
    name: 'Signup',
    component: Signup,
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;