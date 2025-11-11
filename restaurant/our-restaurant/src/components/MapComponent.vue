<template>
    <div ref="mapContainer" class="map-container"></div>

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
import { Cluster } from 'ol/source';

import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Icon, Text, Style, Circle, Fill, Stroke } from 'ol/style';
import Overlay from 'ol/Overlay';

// 부모(HomeView)로부터 받는 props
const props = defineProps({
    restaurants: {
        type: Array,
        required: true
    },
    selectedRestaurantId: {
        type: String,
        default: null
    }
});

// 부모(HomeView)에게 보낼 이벤트
const emit = defineEmits(['restaurant-selected']);
const mapContainer = ref(null); // 지도가 바인딩될 DOM ref
const map = ref(null); // OpenLayers Map 객체
const vectorLayer = ref(null);
const clusterSource = ref(null);
const popupOverlay = ref(null);
const selectedMarkerLayer = ref(null);
let selectedFeatureId = null;

// 마커 스타일
const defaultMarkerStyle = new Style({
    image: new Circle({
        radius: 8,
        fill: new Fill({ color: 'rgba(0, 123, 255, 0.6)' }),
        stroke: new Stroke({ color: '#fff', width: 2 })
    })
});

const selectedMarkerStyle = new Style({
    image: new Icon({
        anchor: [0.5, 1.2],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        src: '/img/arrow.png',
        scale: 0.1
    })
});

selectedMarkerLayer.value = new VectorLayer({
    source: new VectorSource(),
    zIndex: 20, // 클러스터 위로 올라오도록
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
        emit('restaurant-selected', null);
        return false;
    };

    const source = new VectorSource();
    clusterSource.value = new Cluster({
        distance: 40, // 마커 간 거리 (픽셀 단위)
        source: source
    });

    vectorLayer.value = new VectorLayer({
        source: clusterSource.value,
        style: (feature) => {
            const size = feature.get('features').length; // 클러스터 내 마커 개수
            if (size > 1) {
                // 여러 개 묶인 클러스터 스타일
                return new Style({
                    image: new Circle({
                        radius: 10 + Math.min(size, 10), // 개수에 따라 크기 조절
                        fill: new Fill({ color: 'rgba(0, 123, 255, 0.6)' }),
                        stroke: new Stroke({ color: '#fff', width: 2 }),
                    }),
                    text: new Text({
                        text: size.toString(),
                        fill: new Fill({ color: '#fff' }),
                    }),
                });
            }

            return defaultMarkerStyle;

        },
    });

    map.value = new Map({
        target: mapContainer.value,
        layers: [
            new TileLayer({ source: new OSM() }),
            vectorLayer.value,
        ],
        overlays: [popupOverlay.value],
        view: new View({
            center: fromLonLat([127.047832752, 37.652775322]),
            zoom: 17
        })
    });
    map.value.addLayer(selectedMarkerLayer.value);

    map.value.on('click', (evt) => {
        const features = map.value.getFeaturesAtPixel(evt.pixel);

        if (features.length === 0) {
            popupOverlay.value.setPosition(undefined);
            emit('restaurant-selected', null);
            return;
        }

        const clusterFeature = features[0];
        const clustered = clusterFeature.get('features'); // 실제 음식점 features 배열

        // 단일 음식점 클릭 시
        if (clustered.length === 1) {
            const feature = clustered[0];
            const restaurantId = feature.get('restaurantId');
            const coordinate = feature.getGeometry().getCoordinates();

            popupContent.innerHTML = `<div class="restaurant-single"><b>${feature.get('name')}</b></div>`;
            popupOverlay.value.setPosition(coordinate);

            emit('restaurant-selected', restaurantId);
        }

        // 여러 음식점이 같은 클러스터일 때
        else {
            const restaurantInfos = clustered
                .map(f => ({
                    id: f.get('restaurantId'),
                    name: f.get('name')
                }))
                .filter(r => r.id);

            const coordinate = clusterFeature.getGeometry().getCoordinates();

            const listHtml = `
            <div class="restaurant-single">
                <b>이 위치의 음식점 (${restaurantInfos.length})</b>
                <ul>
                    ${restaurantInfos.map(r => `
                        <li class="restaurant-item" data-id="${r.id}">
                            <button class="restaurant-name">${r.name}</button>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;

            popupContent.innerHTML = listHtml;
            popupOverlay.value.setPosition(coordinate);

            popupContent.querySelectorAll('.restaurant-item').forEach(item => {
                item.addEventListener('click', () => {
                    const id = item.getAttribute('data-id');
                    emit('restaurant-selected', id);
                });
            });

        }
    });


    // 마우스 커서 변경
    map.value.on('pointermove', (e) => {
        const pixel = map.value.getEventPixel(e.originalEvent);
        const hit = map.value.hasFeatureAtPixel(pixel);
        map.value.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });

};

const showSelectedMarker = (feature) => {
    const source = selectedMarkerLayer.value.getSource();
    source.clear(); // 기존 선택 마커 제거

    if (!feature) return; // 선택 해제 시 아무것도 표시하지 않음

    const coord = feature.getGeometry().getCoordinates();

    const selectedFeature = new Feature({
        geometry: new Point(coord),
        restaurantId: feature.getId()
    });

    selectedFeature.setStyle(selectedMarkerStyle); // 기존에 준비한 화살표 스타일

    source.addFeature(selectedFeature);
};

// 맛집 목록(prop)이 변경되면 마커를 다시 그리는 함수
const updateMarkers = (restaurants) => {
    if (!vectorLayer.value) return;

    // Pinia 프록시 객체를 순수 배열로 변환
    const restaurantsRaw = toRaw(restaurants);

    const source = vectorLayer.value.getSource();
    source.clear(); // 기존 마커 제거

    const features = restaurantsRaw.map(r => {
        const feature = new Feature({
            geometry: new Point(fromLonLat(r.coords)),
            restaurantId: r.id,
            name: r.name,
        });

        feature.setId(r.id);

        feature.setStyle(defaultMarkerStyle);

        return feature;
    });

    // 클러스터 내부 원본 source에 추가
    clusterSource.value.getSource().clear();
    clusterSource.value.getSource().addFeatures(features);
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

watch(
    () => props.selectedRestaurantId,
    (newId) => {
        selectedFeatureId = newId; // 선택된 ID 기억
        if (!map.value || !clusterSource.value) return;

        // 클러스터 소스에서 모든 feature 가져오기
        const clusterFeatures = clusterSource.value.getSource().getFeatures();

        const allFeatures = clusterFeatures.flatMap(f => {
            const feature = toRaw(f);
            const inner = feature.get('features');

            // inner가 있으면 cluster 안 feature 반환, 없으면 자기 자신 반환
            if (Array.isArray(inner)) return inner;
            return [feature]; // 단일 마커일 경우
        });



        // 선택된 feature 찾기
        const selectedFeature = allFeatures.find(f => f.getId() === newId);

        if (selectedFeature) {
            const coord = selectedFeature.getGeometry().getCoordinates();

            // 지도 이동
            map.value.getView().animate({
                center: coord,
                duration: 500,
                zoom: 19 // 필요하면 줌 레벨 조정
            });
        }
        showSelectedMarker(selectedFeature);

        // 스타일 다시 렌더링
        vectorLayer.value.changed();
    }
);

watch(
    () => props.restaurants,
    (newRestaurants) => {
        updateMarkers(toRaw(newRestaurants));
    },
    { deep: true }
);

</script>
