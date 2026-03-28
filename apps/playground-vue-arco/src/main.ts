import { createApp } from 'vue';
import ArcoVue from '@arco-design/web-vue';
// 根据架构要求，在沙箱全局引入 Arco 原生样式以支持各类 UI 渲染
import '@arco-design/web-vue/dist/arco.css';
import ArcoVueIcon from '@arco-design/web-vue/es/icon';

import router from './router';
import App from './App.vue';

const app = createApp(App);
app.use(ArcoVue);
app.use(ArcoVueIcon);
app.use(router);
app.mount('#app');
