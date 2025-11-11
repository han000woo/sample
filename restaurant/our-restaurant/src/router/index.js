import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import LoginView from '../views/LoginView.vue';
import SignupView from '@/views/SignupView.vue';
// import store from '../store'; // 상태 체크를 위해 store 임포트 (삭제)
import { useAuthStore } from '../store/auth'; // auth 스토어 임포트
import MyMapVIew from '@/views/MyMapVIew.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
    meta: { requiresAuth: true } // 이 라우트는 로그인이 필요
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView
  },
  { 
    path: '/signup',
    name: 'Signup',
    component: SignupView
  },
  { 
    path: '/my-map',
    name: 'MyMap',
    component: MyMapVIew
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 네비게이션 가드 (라우트 이동 전 체크)
router.beforeEach((to, from, next) => {
  // 훅 내부에서 스토어를 인스턴스화해야 Pinia가 활성화된 후 접근 가능
  const authStore = useAuthStore();
  const isLoggedIn = authStore.isLoggedIn;

  if (to.meta.requiresAuth && !isLoggedIn) {
    // 로그인이 필요한 페이지에 비로그인 상태로 접근 시
    next('/login');
  } else if ((to.path === '/login' || to.path === '/signup') && isLoggedIn) { 
    // 로그인 상태에서 로그인 페이지 접근 시
    next('/');
  } else {
    // 그 외에는 정상 이동
    next();
  }
});

export default router;