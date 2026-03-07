import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import Layout from '../layout/index.vue';

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        component: Layout,
        redirect: '/table',
        children: [
            {
                path: 'table',
                name: 'TableDemo',
                component: () => import('../views/TableDemo.vue'),
                meta: { title: 'ProTable 演示' }
            },
            {
                path: 'form',
                name: 'FormDemo',
                component: () => import('../views/FormDemo.vue'),
                meta: { title: 'ProForm 演示' }
            }
        ]
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

export default router;
