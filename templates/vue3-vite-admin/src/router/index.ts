import { createRouter, createWebHashHistory } from 'vue-router';

/**
 * 路由配置
 * 采用懒加载（动态 import）减小首屏包体积
 */
const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            component: () => import('../layouts/BasicLayout.vue'),
            children: [
                {
                    path: '',
                    redirect: '/user'
                },
                {
                    path: 'user',
                    name: 'UserManagement',
                    component: () => import('../views/UserManagement.vue'),
                    meta: { title: '用户管理', icon: 'icon-user' }
                },
                // ↓ 在此追加更多业务路由
            ]
        }
    ]
});

export default router;
