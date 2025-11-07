import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; 

const app = createApp(App);

app.use(router); // 앱에 라우터 사용 등록
app.mount('#app');