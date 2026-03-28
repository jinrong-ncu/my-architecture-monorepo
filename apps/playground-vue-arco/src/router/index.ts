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
            },
            {
                path: 'modal',
                name: 'ModalDemo',
                component: () => import('../views/ModalDemo.vue'),
                meta: { title: 'ProModal 演示' }
            },
            {
                path: 'upload',
                name: 'UploadDemo',
                component: () => import('../views/UploadDemo.vue'),
                meta: { title: 'ProUpload 演示' }
            },
            {
                path: 'pro-table-form',
                name: 'ProTableFormDemo',
                component: () => import('../views/pro-table-form/index.vue'),
                meta: { title: 'ProTableForm 演示' }
            }
        ]
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

export default router;
