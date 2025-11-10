import { defineStore } from 'pinia';
// import { fetchRestaurants, addComment as apiAddComment } from '../api/mockApi'; // Mock API 삭제
import api from '../api/client'; // 실제 API 클라이언트 임포트
import { useAuthStore } from './auth'; 

// (Model - Pinia Store)
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
      try {
        // (실제 API 호출로 변경)
        // FastAPI에 /restaurants 엔드포인트가 있다고 가정
        const response = await api.get('/stores');
        
        this.restaurants = response.data;
        // --- (임시) ---
        // 아직 백엔드에 /restaurants가 없으므로, Mock 데이터를 임시로 사용
        // 실제로는 위 코드를 사용하고 아래 3줄은 삭제
        // const mockData = await (await import('../api/mockApi')).fetchRestaurants();
        // this.restaurants = mockData;
        // --- (임시) ---
        
      } catch (error) {
        console.error("맛집 목록 로딩 실패:", error);
        // 인터셉터가 401을 처리함.
      }
    },

     async addComment(restaurantId, commentData) {
      // (Model이 ViewModel의 요청을 받아 API와 통신)
      
      try {
        // [수정] Mock API 대신 실제 FastAPI 엔드포인트 호출
        const response = await api.post(
          `comment/${restaurantId}/`, 
          {
            rating: parseInt(commentData.rating),
            text: commentData.text
          }
        );
        
        // FastAPI가 새로 생성된 CommentRead 객체를 반환
        const newComment = response.data; 

        // (Model이 State를 변경)
        const restaurant = this.restaurants.find(r => r.id === restaurantId);
        if (restaurant) {
          // 백엔드에서 받은 실제 댓글 데이터(author 포함)를 푸시
          restaurant.comments.push(newComment);
        }
        
      } catch (error) {
        console.error("댓글 등록 실패:", error);
        alert(`댓글 등록에 실패했습니다: ${error.response?.data?.detail || error.message}`);
      }
    },
  },
});