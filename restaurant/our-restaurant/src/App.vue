<template>
  <router-view></router-view>
</template>

<script setup>
</script>

<style>
.map-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
}

#popup {
  background-color: white;
  padding: 14px 30px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #ccc;
  position: absolute;
  transform: translate(-50%, -20%);
  bottom: 12px;
  min-width: 200px;
  white-space: nowrap;
  user-select: none;
}

/* 말풍선 화살표 */
#popup::after {
  content: "";
  position: absolute;
  top: 100%;
  /* 박스의 맨 아래쪽에 위치 */
  left: 50%;
  /* 중앙정렬 */
  margin-left: -10px;
  border-width: 10px;
  border-style: solid;
  border-color: white transparent transparent transparent;
  filter: drop-shadow(0 -1px 1px rgba(0, 0, 0, 0.1));
  /* 살짝 그림자 효과 */
}

#poppup:before {
  border-top-color: #ccc;
  border-width: 11px;
  left: 48px;
  margin-left: -11px;
}

#popup-closer {
  text-decoration: none;
  position: absolute;
  top: 2px;
  right: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
}
</style>