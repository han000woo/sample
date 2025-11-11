import { defineStore } from 'pinia';
import api from '../api/client'; // Axios 클라이언트 임포트
import { useAuthStore } from './auth'; // 인증 스토어

export const useRestaurantStore = defineStore('restaurants', {
  // (Model)
  state: () => ({
    restaurants: [],
    isLoading: false,
    currentRestaurantId: null,
    currentFavoriteStatus: false, // [신규] 현재 선택된 맛집의 즐겨찾기 상태
  }),

  // (ViewModel - Getters)
  getters: {
    // 선택된 맛집 정보 반환
    selectedRestaurant: (state) => {
      return state.restaurants.find(r => r.id === state.currentRestaurantId) || null;
    },
    // 선택된 맛집의 댓글 목록 반환
    selectedComments: (state) => {
      const restaurant = state.restaurants.find(r => r.id === state.currentRestaurantId);
      return restaurant ? restaurant.comments : [];
    }
  },

  // (ViewModel - Actions)
  actions: {
    /**
     * 전체 맛집 목록을 API에서 불러옵니다.
     */
    async loadRestaurants() {
      this.isLoading = true;
      try {
        const response = await api.get('/stores/');
        this.restaurants = response.data;
      } catch (error) {
        console.error("맛집 목록 로딩 실패:", error);
        this.restaurants = [];
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * [신규] 나의 즐겨찾기 맛집 목록을 불러옵니다.
     */
    async loadMyFavoriteRestaurants() {
      this.isLoading = true;
      const authStore = useAuthStore();
      if (!authStore.isLoggedIn) {
        console.warn("로그인이 필요합니다.");
        this.restaurants = []; // 비로그인 시 비우기
        this.isLoading = false;
        return;
      }
      
      try {
        const response = await api.get('/favorites/me');
        this.restaurants = response.data;
      } catch (error) {
        console.error("즐겨찾기 목록 로딩 실패:", error);
        this.restaurants = [];
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 맛집을 선택하고 즐겨찾기 상태를 확인합니다.
     * @param {string} id - 맛집 ID (bizesId)
     */
    async selectRestaurant(id) {
      this.currentRestaurantId = id;
      // 맛집이 선택되면, 즉시 즐겨찾기 상태 확인
      await this.checkFavoriteStatus(id);
    },

    /**
     * 선택된 맛집을 해제합니다.
     */
    clearSelectedRestaurant() {
      this.currentRestaurantId = null;
      this.currentFavoriteStatus = false;
    },

    /**
     * 새 댓글을 서버에 전송합니다.
     * @param {string} store_id - 맛집 ID (bizesId)
     * @param {object} commentData - { text: string, rating: number }
     */
    async addComment(store_id, commentData) {
      const authStore = useAuthStore();
      if (!authStore.isLoggedIn) {
        alert("댓글을 작성하려면 로그인이 필요합니다.");
        return;
      }

      try {
        // API 호출 (POST /api/v1/stores/{store_id}/comments)
        const response = await api.post(
          `/comment/${store_id}`, 
          commentData
        );
        
        // API로부터 새로 생성된 댓글 정보(author 포함)를 받음
        const newComment = response.data; 
        
        // 상태(state) 업데이트
        const restaurant = this.restaurants.find(r => r.id === store_id);
        if (restaurant) {
          restaurant.comments.push(newComment);
        }
      } catch (error) {
        console.error("댓글 추가 실패:", error);
        alert(`댓글 추가 실패: ${error.response?.data?.detail || '서버 오류'}`);
      }
    },

    // --- [신규] 즐겨찾기 관련 Actions ---

    /**
     * 특정 맛집의 즐겨찾기 상태를 API에 확인합니다.
     * @param {string} store_id - 맛집 ID (bizesId)
     */
    async checkFavoriteStatus(store_id) {
      const authStore = useAuthStore();
      if (!authStore.isLoggedIn || !store_id) {
        this.currentFavoriteStatus = false;
        return;
      }
      try {
        const response = await api.get(`/favorites/check/${store_id}`);
        this.currentFavoriteStatus = response.data.is_favorite;
      } catch (error) {
        console.error("즐겨찾기 상태 확인 실패:", error);
        this.currentFavoriteStatus = false;
      }
    },

    /**
     * 맛집을 즐겨찾기에 추가합니다.
     * @param {string} store_id - 맛집 ID (bizesId)
     */
    async addFavorite(store_id) {
      try {
        await api.post('/favorites/', { store_id: store_id });
        this.currentFavoriteStatus = true;
      } catch (error) {
        console.error("즐겨찾기 추가 실패:", error);
      }
    },

    /**
     * 맛집을 즐겨찾기에서 제거합니다.
     * @param {string} store_id - 맛집 ID (bizesId)
     */
    async removeFavorite(store_id) {
      try {
        await api.delete(`/api/v1/favorites/${store_id}`);
        this.currentFavoriteStatus = false;
      } catch (error) {
        console.error("즐겨찾기 제거 실패:", error);
      }
    },
  }
});