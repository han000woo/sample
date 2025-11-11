<template>
    <!-- (View) -->
    <!-- 지도가 렌더링될 DOM 요소 -->
    <div ref="mapContainer" class="map-container"></div>
    <!-- 팝업 오버레이 (맵 컴포넌트가 사용) -->
    <div id="popup" class="ol-popup" style="display: none;">
        <a href="#" id="popup-closer" class="ol-popup-closer">&times;</a>
        <div id="popup-content"></div>
    </div>
</template>
<script setup>
// (ViewModel)
import { ref, onMounted, onUnmounted, watch, inject, toRaw } from 'vue';
import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Style, Circle, Fill, Stroke } from 'ol/style';
import Overlay from 'ol/Overlay';

// 부모(HomeView)로부터 받는 props
const props = defineProps({
    restaurants: {
        type: Array,
        required: true
    }
});

// 부모(HomeView)에게 보낼 이벤트
const emit = defineEmits(['restaurant-selected']);

const store = inject('store');

const mapContainer = ref(null); // 지도가 바인딩될 DOM ref
const map = ref(null); // OpenLayers Map 객체
const vectorLayer = ref(null);
const popupOverlay = ref(null);

// 마커 스타일
const markerStyle = new Style({
    image: new Circle({
        radius: 8,
        fill: new Fill({ color: 'rgba(255, 0, 0, 0.7)' }),
        stroke: new Stroke({ color: '#fff', width: 2 })
    })
});

// 맵 초기화
const initMap = () => {
    if (!mapContainer.value) return;

    // 팝업 관련 DOM 요소 (HomeView에 있음)
    const popupContainer = document.getElementById('popup');
    const popupContent = document.getElementById('popup-content');
    const popupCloser = document.getElementById('popup-closer');

    popupContainer.style.display = 'block'; // 맵 초기화 시 보이도록 변경

    popupOverlay.value = new Overlay({
        element: popupContainer,
        autoPan: { animation: { duration: 250 } }
    });

    popupCloser.onclick = () => {
        popupOverlay.value.setPosition(undefined);
        popupCloser.blur();
        return false;
    };

    vectorLayer.value = new VectorLayer({
        source: new VectorSource(),
    });

    map.value = new Map({
        target: mapContainer.value,
        layers: [
            new TileLayer({ source: new OSM() }),
            vectorLayer.value
        ],
        overlays: [popupOverlay.value],
        view: new View({
            center: fromLonLat([127.047832752, 37.652775322]),
            zoom: 17
        })
    });

    // 맵 클릭 이벤트
    map.value.on('click', (evt) => {
        const feature = map.value.forEachFeatureAtPixel(evt.pixel, (f) => f);

        if (feature && feature.get('restaurantId')) {
            const restaurantId = feature.get('restaurantId');
            const coordinate = feature.getGeometry().getCoordinates();

            popupContent.innerHTML = `<b>${feature.get('name')}</b>`;
            popupOverlay.value.setPosition(coordinate);

            // (ViewModel이 View(부모)로 이벤트를 emit)
            emit('restaurant-selected', restaurantId);

        } else {
            popupOverlay.value.setPosition(undefined);
            emit('restaurant-selected', null);
        }
    });

    // 마우스 커서 변경
    map.value.on('pointermove', (e) => {
        const pixel = map.value.getEventPixel(e.originalEvent);
        const hit = map.value.hasFeatureAtPixel(pixel);
        map.value.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });
};

// 맛집 목록(prop)이 변경되면 마커를 다시 그리는 함수
const updateMarkers = (restaurants) => {
    if (!vectorLayer.value) return;

    // Pinia 프록시 객체를 순수 배열로 변환
    const restaurantsRaw = toRaw(restaurants);

    const source = vectorLayer.value.getSource();
    source.clear(); // 기존 마커 제거

    const markerFeatures = restaurantsRaw.map(r => {
        // const rawR = toRaw(r); // 중복 toRaw 제거

        const feature = new Feature({
            geometry: new Point(fromLonLat(r.coords)),
            restaurantId: r.id,
            name: r.name,
        });

        feature.setStyle(markerStyle);

        return feature;
    });

    source.addFeatures(markerFeatures);
};

// --- Lifecycle Hooks ---
onMounted(() => {
    initMap();
    // 초기 마커 업데이트
    updateMarkers(props.restaurants);
});

onUnmounted(() => {
    // 컴포넌트가 사라질 때 맵 객체 정리
    if (map.value) {
        map.value.setTarget(null);
        map.value = null;
    }
    // 팝업도 다시 숨김
    const popupContainer = document.getElementById('popup');
    if (popupContainer) popupContainer.style.display = 'none';
});

// props.restaurants가 (store에 의해) 변경되면 마커 업데이트
watch(
    () => props.restaurants,
    (newRestaurants) => {
        updateMarkers(toRaw(newRestaurants));
    },
    { deep: true }
);

</script>