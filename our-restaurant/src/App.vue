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
  padding: 10px 15px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #ccc;
  position: absolute;
  transform: translate(-50%, -100%);
  bottom: 12px;
  left: -50px;
  min-width: 200px;
  white-space: nowrap;
}

#popup:after,
#popup:before {
  top: 100%;
  border: solid transparent;
  content: " ";
  height: 0;
  width: 0;
  position: absolute;
  pointer-events: none;
}

#poppup:after {
  border-top-color: white;
  border-width: 10px;
  left: 48px;
  margin-left: -10px;
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