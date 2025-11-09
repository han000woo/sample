<template>
    <!-- (View) -->
    <aside>
        <div v-if="!restaurant">
            <h3 class="text-xl font-semibold text-gray-800">맛집을 선택하세요</h3>
            <p class="text-gray-600 mt-2">지도 위의 아이콘을 클릭하면 맛집 정보와 리뷰를 볼 수 있습니다.</p>
        </div>

        <div v-else>
            <!-- 맛집 정보 -->
            <h3 class="text-2xl font-bold text-blue-700 mb-3">{{ restaurant.name }}</h3>
            <p class="text-gray-600 mb-2">{{ restaurant.category }}</p>
            <p class="text-gray-800 mb-4">{{ restaurant.address }}</p>

            <div class="flex items-center mb-4">
                <span class="text-lg font-semibold text-yellow-500 mr-2">
                    평균 별점: {{ formatRating(averageRating) }}
                </span>
                <div class="flex">
                    <span v-for="n in 5" :key="'avg-' + n" class="text-yellow-400">
                        {{ n <= averageRating ? '★' : '☆' }} </span>
                </div>
                <span class="text-sm text-gray-500 ml-2">({{ restaurant.comments.length }}개 리뷰)</span>
            </div>

            <hr class="my-4">

            <!-- 댓글 목록 -->
            <h4 class="text-lg font-semibold mb-3">리뷰 및 댓글</h4>
            <div class="space-y-4 max-h-60 overflow-y-auto pr-2">
                <div v-if="restaurant.comments.length === 0" class="text-gray-500 text-center py-4">
                    아직 등록된 리뷰가 없습니다.
                </div>
                <div v-for="comment in restaurant.comments" :key="comment.id"
                    class="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                    <div class="flex justify-between items-center mb-1">
                        <span class="font-semibold text-gray-800">{{ comment.author }}</span>
                        <div class="flex text-yellow-400">
                            <span v-for="n in 5" :key="'cmt-' + n">
                                {{ n <= comment.rating ? '★' : '☆' }} </span>
                        </div>
                    </div>
                    <p class="text-gray-700">{{ comment.text }}</p>
                </div>
            </div>

            <hr class="my-6">

            <!-- 새 댓글 작성 폼 -->
            <h4 class="text-lg font-semibold mb-3">리뷰 남기기</h4>
            <form @submit.prevent="submitComment">
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
                    <label for="comment-text" class="block text-sm font-medium text-gray-700 mb-1">내용</label>
                    <textarea id="comment-text" v-model="newComment.text" rows="3"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="맛집에 대한 리뷰를 남겨주세요."></textarea>
                </div>
                <button type="submit"
                    class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition duration-300">
                    등록하기
                </button>
            </form>
        </div>
    </aside>
</template>

<script setup>
// (ViewModel)
import { ref, reactive, computed, watch } from 'vue';

// 부모(HomeView)로부터 선택된 맛집 정보를 받음
const props = defineProps({
    restaurant: {
        type: Object,
        default: null
    }
});

// 부모(HomeView)에게 댓글 추가 이벤트를 보냄
const emit = defineEmits(['add-comment']);

// 새 댓글 폼을 위한 로컬 상태
const newComment = reactive({
    rating: 5,
    text: ''
});

// (ViewModel - Computed Property)
const averageRating = computed(() => {
    if (!props.restaurant || props.restaurant.comments.length === 0) {
        return 0;
    }
    const total = props.restaurant.comments.reduce((acc, comment) => acc + comment.rating, 0);
    return total / props.restaurant.comments.length;
});

const formatRating = (rating) => {
    return rating.toFixed(1);
};

// (ViewModel - Method)
const submitComment = () => {
    if (!newComment.text.trim()) {
        alert('내용을 입력해주세요.');
        return;
    }

    // 부모에게 이벤트 emit
    emit('add-comment', { ...newComment });

    // 폼 초기화
    newComment.rating = 5;
    newComment.text = '';
};

// 맛집 선택이 바뀌면 폼 초기화
watch(() => props.restaurant, () => {
    newComment.rating = 5;
    newComment.text = '';
});
</script>