<template>
    <!-- (View) -->
    <div class="sidebar-container bg-white shadow-lg overflow-y-auto">
        <!-- 1. 로고 및 로그아웃 -->
        <div class="p-4 border-b flex justify-between items-center">
            <h1 class="text-2xl font-bold text-blue-600">맛집 지도</h1>
            <button @click="handleLogout" class="text-sm text-gray-500 hover:text-red-500 hover:underline">
                로그아웃 ({{ authStore.currentUser }})
            </button>
        </div>

        <!-- 2. 맛집 정보 (선택되었을 때) -->
        <div v-if="selectedRestaurant" class="p-4 border-b">
            <h2 class="text-xl font-semibold mb-2">{{ selectedRestaurant.name }}</h2>
            <p classs="text-sm text-gray-600 mb-1">{{ selectedRestaurant.category }}</p>
            <p classs="text-sm text-gray-500 mb-4">{{ selectedRestaurant.address }}</p>

            <!-- [신규] 즐겨찾기 버튼 (동적) -->
            <button @click="handleFavoriteToggle" :class="[
                'w-full py-2 px-4 rounded-lg font-semibold transition duration-300',
                restaurantStore.currentFavoriteStatus
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-yellow-400 text-gray-800 hover:bg-yellow-500'
            ]">
                {{ restaurantStore.currentFavoriteStatus ? '내 지도에서 제거' : '내 지도에 추가 ★' }}
            </button>

            <!-- 3. 댓글 목록 -->
            <div class="mt-6">
                <h3 class="text-lg font-semibold mb-3">
                    리뷰 ({{ selectedComments.length }}개)
                </h3>

                <ul v-if="selectedComments.length > 0"
                    class="space-y-3 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    <li v-for="comment in selectedComments" :key="comment.id"
                        class="p-3 bg-gray-50 rounded-lg shadow-sm">
                        <div class="flex justify-between items-center mb-1">
                            <span class="font-semibold text-sm">{{ comment.author }}</span>
                            <span class="text-xs text-yellow-500">
                                {{ '★'.repeat(comment.rating) }}{{ '☆'.repeat(5 - comment.rating) }}
                            </span>
                        </div>
                        <p class="text-sm text-gray-700">{{ comment.text }}</p>
                    </li>
                </ul>

                <p v-else class="text-sm text-gray-500 italic">아직 리뷰가 없습니다.</p>
            </div>


            <!-- 4. 댓글 작성 폼 -->
            <form @submit.prevent="handleCommentSubmit" class="mt-5">
                <h4 class="text-md font-semibold mb-2">리뷰 남기기</h4>
                <div class="mb-3">
                    <label for="rating" class="block text-sm font-medium text-gray-700 mb-1">별점</label>
                    <select v-model="newComment.rating" id="rating"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="5">★★★★★ (5점)</option>
                        <option value="4">★★★★☆ (4점)</option>
                        <option value="3">★★★☆☆ (3점)</option>
                        <option value="2">★★☆☆☆ (2점)</option>
                        <option value="1">★☆☆☆☆ (1점)</option>
                    </select>
                </div>
                <div class="mb-3">
                    <textarea v-model.trim="newComment.text" placeholder="솔직한 리뷰를 남겨주세요." required rows="3"
                        class="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
                <button type="submit"
                    class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition duration-300">
                    댓글 등록
                </button>
            </form>

        </div>

        <!-- 5. 기본 안내 (선택되지 않았을 때) -->
        <div v-else class="p-6 text-center">
            <p class="text-gray-600">지도에서 맛집을 선택해주세요!</p>
        </div>
    </div>
</template>

<script setup>
// (ViewModel)
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '../store/auth';
import { useRestaurantStore } from '../store/restaurants';

// --- 스토어 및 라우터 설정 ---
const authStore = useAuthStore();
const restaurantStore = useRestaurantStore();
const router = useRouter();

// --- 반응형 상태 ---
// storeToRefs를 사용해 state와 getter를 반응형으로 가져옴
const { selectedRestaurant, selectedComments } = storeToRefs(restaurantStore);

// 댓글 폼을 위한 내부 상태
const newComment = reactive({
    rating: 5,
    text: ''
});

// --- 이벤트 핸들러 ---

/**
 * 로그아웃 처리
 */
const handleLogout = () => {
    authStore.logout();
    router.push('/login');
};

/**
 * 댓글 폼 제출 처리
 */
const handleCommentSubmit = async () => {
    if (!newComment.text) {
        alert("댓글 내용을 입력해주세요.");
        return;
    }
    if (!selectedRestaurant.value) return;

    // 스토어 액션 호출 (백엔드 API 호출)
    await restaurantStore.addComment(selectedRestaurant.value.id, {
        text: newComment.text,
        rating: newComment.rating
    });

    // 폼 초기화
    newComment.text = '';
    newComment.rating = 5;
};

/**
 * [신규] 즐겨찾기 버튼 토글 처리
 */
const handleFavoriteToggle = async () => {
    if (!selectedRestaurant.value) return;

    const store_id = selectedRestaurant.value.id;

    if (restaurantStore.currentFavoriteStatus) {
        // 이미 즐겨찾기 상태 -> 제거
        await restaurantStore.removeFavorite(store_id);
        // [선택 사항] "내 지도" 페이지에 있다면, 목록에서 즉시 제거
        if (router.currentRoute.value.path === '/my-map') {
            restaurantStore.restaurants = restaurantStore.restaurants.filter(r => r.id !== store_id);
            restaurantStore.clearSelectedRestaurant();
        }
    } else {
        // 즐겨찾기 아님 -> 추가
        await restaurantStore.addFavorite(store_id);
    }
};
</script>

<style scoped>
/* 사이드바 고정 스타일 */
.sidebar-container {
    width: 400px;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
    /* Tailwind의 shadow-lg 사용 */
}

/* 모바일 화면에서는 사이드바를 숨기거나 너비를 100%로 하는 등의 처리가 필요할 수 있습니다. 
   (지금은 데스크탑 우선) 
*/
@media (max-width: 768px) {
    .sidebar-container {
        width: 100%;
        height: 40vh;
        /* 모바일에서는 하단 시트처럼 */
        bottom: 0;
        top: auto;
        left: 0;
        z-index: 1000;
    }
}
</style>