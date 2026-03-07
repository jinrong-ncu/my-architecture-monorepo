import { createApp } from 'vue';
import ArcoVue from '@arco-design/web-vue';
// 根据架构要求，在沙箱全局引入 Arco 原生样式以支持各类 UI 渲染
import '@arco-design/web-vue/dist/arco.css';

import App from './App.vue';

const app = createApp(App);
app.use(ArcoVue);
app.mount('#app');
