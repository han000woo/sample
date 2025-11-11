<template>
  <!-- (View) -->
  <div class="main-container">
    <!-- 1. 사이드바 (View) -->
    <!-- Sidebar는 restaurantStore의 selectedRestaurant/selectedComments를
         자동으로 감지하여 렌더링합니다. -->
    <Sidebar />

    <!-- 2. 메인 컨텐츠 (지도 + 팝업) -->
    <div class="map-area">
      <!-- 2-1. 헤더 (오늘의 추천 / 전체 지도) -->
      <header class="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex gap-4">
        <button
          @click="handleRandomPick"
          class="bg-white text-blue-600 font-semibold py-2 px-5 rounded-full shadow-lg hover:bg-blue-50 transition duration-300"
        >
          ★ 오늘의 추천
        </button>
        <!-- [수정] '전체 지도'로 가는 링크로 변경 -->
        <router-link
          to="/"
          class="bg-white text-gray-700 font-semibold py-2 px-5 rounded-full shadow-lg hover:bg-gray-50 transition duration-300"
        >
          전체 지도 보기
        </router-link>
      </header>

      <!-- 2-2. 지도 컴포넌트 (View) -->
      <!-- :restaurants="restaurants" 
           :selectedRestaurantId="selectedRestaurantId"
           @restaurant-selected="handleRestaurantSelected" -->
      <MapComponent
        :restaurants="restaurants"
        :selectedRestaurantId="selectedRestaurantId"
        @restaurant-selected="handleRestaurantSelected"
      />

      <!-- 2-3. OpenLayers 팝업 DOM (View) -->
      <!-- MapComponent가 이 DOM을 찾아 Overlay로 사용합니다. -->
      <div id="popup" class="ol-popup">
        <a href="#" id="popup-closer" class="ol-popup-closer">×</a>
        <div id="popup-content"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
// (ViewModel)
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRestaurantStore } from '../store/restaurants';

// --- 컴포넌트 임포트 ---
import Sidebar from '../components/Sidebar.vue';
import MapComponent from '../components/MapComponent.vue';

// --- 스토어 설정 ---
const restaurantStore = useRestaurantStore();

// --- 반응형 상태 (State & Getters) ---
// Pinia 스토어에서 state와 getter를 반응형으로 가져옵니다.
const { restaurants, currentRestaurantId: selectedRestaurantId } = storeToRefs(restaurantStore);

// --- 라이프사이클 훅 ---
onMounted(() => {
  // [수정] 'MyMapView'가 마운트되면, '전체 맛집'이 아닌 '내 즐겨찾기'를 로드합니다.
  restaurantStore.loadMyFavoriteRestaurants();
});

// --- 이벤트 핸들러 (Actions) ---

/**
 * MapComponent에서 맛집이 선택되었을 때 호출되는 핸들러
 * @param {string | null} id - 선택된 맛집 ID
 */
const handleRestaurantSelected = (id) => {
  if (id) {
    restaurantStore.selectRestaurant(id);
  } else {
    restaurantStore.clearSelectedRestaurant();
  }
};

/**
 * "오늘의 추천" 버튼 클릭 시 핸들러
 */
const handleRandomPick = () => {
  const allRestaurants = restaurants.value;
  if (allRestaurants.length === 0) {
    alert("맛집이 없습니다!");
    return;
  }
  
  // 랜덤 맛집 선택
  const randomIndex = Math.floor(Math.random() * allRestaurants.length);
  const randomRestaurant = allRestaurants[randomIndex];
  
  // 스토어 액션 호출 (선택 + 즐겨찾기 상태 확인)
  restaurantStore.selectRestaurant(randomRestaurant.id);
  
  // (MapComponent는 selectedRestaurantId prop을 watch하고 있으므로
  //  자동으로 지도를 이동시킬 것입니다.)
};

</script>

<style scoped>
.main-container {
  display: flex;
  width: 100vw;
  height: 100vh;
}
.map-area {
  flex-grow: 1;
  /* 사이드바 너비(400px)만큼 왼쪽 마진을 줍니다 */
  margin-left: 400px;
  height: 100%;
  position: relative; /* 팝업 및 헤더의 기준점 */
}

/* 팝업 스타일 (ol-popup) */
.ol-popup {
      background-color: white;
    padding: 14px 30px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border: 1px solid #ccc;
    position: absolute;
    transform: translate(-50%, -50%);
    bottom: 12px;
    /* left: -50px; */
    min-width: 200px;
    white-space: nowrap;
}
.ol-popup:after, .ol-popup:before {
  top: 100%;
  border: solid transparent;
  content: " ";
  height: 0;
  width: 0;
  position: absolute;
  pointer-events: none;
}
.ol-popup:after {
  border-top-color: white;
  border-width: 10px;
  margin-left: -10px;
}
.ol-popup:before {
  border-top-color: #ccc;
  border-width: 11px;
  left: 50%;
  margin-left: -11px;
}
.ol-popup-closer {
  text-decoration: none;
  position: absolute;
  top: 2px;
  right: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  color: #777;
}
.ol-popup-closer:hover {
  color: #333;
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .main-container {
    flex-direction: column-reverse; /* 모바일에선 지도가 위, 사이드바가 아래 */
  }
  .map-area {
    margin-left: 0;
    flex-grow: 1; /* 남은 공간 모두 차지 */
  }
  
  /* 헤더 위치 조정 */
  header {
    top: 2.5rem; /* 모바일에서는 조금 아래로 */
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>