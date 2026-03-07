import { createApp } from 'vue';
import ArcoDesign from '@arco-design/web-vue';
import '@arco-design/web-vue/dist/arco.css';
import App from './App.vue';
import router from './router';

// 挂载 Arco Design 全局组件 + 路由
createApp(App)
    .use(ArcoDesign)
    .use(router)
    .mount('#app');
