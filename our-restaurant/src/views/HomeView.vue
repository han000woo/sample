<template>
    <!-- (View) -->
    <div class="flex flex-col h-screen">
        <!-- 헤더 -->
        <header class="bg-white shadow-md z-10">
            <div class="container mx-auto px-4 py-4 flex justify-between items-center">
                <h1 class="text-2xl font-bold text-blue-600">내 주변 맛집</h1>
                <div class="flex items-center space-x-4">
                    <!-- 반응형 ref 사용 -->
                    <span class="text-gray-700">환영합니다, <strong>{{ currentUser }}</strong>님!</span>
                    <button @click="handleLogout"
                        class="bg-red-500 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-red-600 transition duration-300">
                        로그아웃
                    </button>
                </div>
            </div>
        </header>

        <!-- 메인 컨텐츠 (지도 + 사이드바) -->
        <main class="flex-1 flex flex-col md:flex-row overflow-hidden">

            <!-- MapComponent -->
            <MapComponent :restaurants="restaurants" @restaurant-selected="handleRestaurantSelect"
                class="flex-1 md:w-2/3 relative" />

            <!-- 팝업 오버레이 (맵 컴포넌트가 사용) -->
            <div id="popup" class="ol-popup" style="display: none;">
                <a href="#" id="popup-closer" class="ol-popup-closer">&times;</a>
                <div id="popup-content"></div>
            </div>

            <!-- Sidebar -->
            <Sidebar :restaurant="selectedRestaurant" @add-comment="handleAddComment"
                class="md:w-1/3 w-full bg-white shadow-lg overflow-y-auto p-6" />

        </main>
    </div>
</template>

<script setup>
// (ViewModel)
import { ref, onMounted, inject } from 'vue'; // inject 삭제
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia'; // storeToRefs 임포트
import { useAuthStore } from '../store/auth'; // Auth 스토어
import { useRestaurantStore } from '../store/restaurants'; // Restaurant 스토어
import MapComponent from '../components/MapComponent.vue';
import Sidebar from '../components/Sidebar.vue';

// const store = inject('store'); // 전역 스토어 (삭제)
const authStore = useAuthStore();
const restaurantStore = useRestaurantStore();
const router = useRouter(); // 라우터

// storeToRefs를 사용해 state와 getter를 반응형 ref로 가져옴
// 이렇게 하면 템플릿에서 .value 없이 사용 가능
const { currentUser } = storeToRefs(authStore);
const { restaurants } = storeToRefs(restaurantStore);

const selectedRestaurant = ref(null);

// (ViewModel이 Model을 호출)
// 뷰가 마운트될 때 맛집 데이터 로드
onMounted(() => {
    restaurantStore.loadRestaurants();
});

// (ViewModel이 View(자식)의 이벤트를 처리)
const handleRestaurantSelect = (restaurantId) => {
    if (restaurantId === null) {
        selectedRestaurant.value = null;
    } else {
        // Pinia 스토어의 getter 사용
        selectedRestaurant.value = restaurantStore.getRestaurantById(restaurantId);
    }
};

const handleAddComment = (commentData) => {
    if (!selectedRestaurant.value) return;

    // (ViewModel이 Model의 메서드를 호출)
    restaurantStore.addComment(selectedRestaurant.value.id, commentData);
};

const handleLogout = () => {
    // (ViewModel이 Model의 메서드를 호출)
    authStore.logout();
    router.push('/login'); // 로그아웃 후 로그인 페이지로
};
</script>