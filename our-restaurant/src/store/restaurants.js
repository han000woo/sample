import { defineStore } from "pinia";
import { fetchRestaurants, addComment as apiAddComment } from "@/api/mockApi";
import { useAuthStore } from "./auth";

// 'restaurant' 스토어 정의
export const useRestaurantStore = defineStore('restaurants', {
    state: () => ({
        restaurants: [],
    }),

    getters: {
        getRestaurantById: (state) => {
            return (id) => state.restaurants.find(r => r.id === id);
        },
    },
    actions: {
        async loadRestaurants() {
            this.restaurants = await fetchRestaurants();
        },

        async addComment(restaurantId, commentData) {
            // 다른 스토어(auth)에 접근
            const authStore = useAuthStore();
            if (!authStore.isLoggedIn) {
                console.error('로그인이 필요합니다.');
                return;
            }

            const newComment = await apiAddComment(restaurantId, commentData, authStore.currentUser);

            // 상태 업데이트
            const restaurant = this.getRestaurantById(restaurantId);
            if (restaurant) {
                restaurant.comments.push(newComment);
            }
        },
    },
});