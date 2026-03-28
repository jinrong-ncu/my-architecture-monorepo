<template>
    <ProLayout
        v-model:collapsed="collapsed"
        title="Rong UI Playground"
        :menus="mockMenus"
        :selected-keys="selectedKeys"
        :open-keys="openKeys"
        @update:open-keys="handleOpenKeysChange"
        @menu-click="handleMenuClick"
    >
        <template #header-right>
            <a-space>
                <a-tag color="arcoblue">Playground</a-tag>
                <a-avatar :size="30">R</a-avatar>
            </a-space>
        </template>

        <router-view />
    </ProLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ProLayout } from 'rongshiyi-ui-vue';
import type { ProLayoutMenuItem } from 'rongshiyi-ui-vue';
import {
    IconLayers,
    IconEdit,
    IconApps,
    IconUpload,
    IconUnorderedList,
    IconDashboard,
} from '@arco-design/web-vue/es/icon';

// 用于控制侧边栏的高亮和页面的路由切换
const router = useRouter();
const route = useRoute();
const collapsed = ref(false);
const openKeys = ref<string[]>([]);

const mockMenus = ref<ProLayoutMenuItem[]>([
    {
        key: '/table',
        title: '工作台',
        icon: IconDashboard,
    },
    {
        key: '/components',
        title: '组件演示',
        icon: IconLayers,
        children: [
            {
                key: '/components/table',
                title: '数据体系',
                icon: IconUnorderedList,
                children: [
                    { key: '/table', title: 'ProTable', icon: IconLayers },
                    { key: '/pro-table-form', title: 'ProTableForm', icon: IconUnorderedList },
                ],
            },
            {
                key: '/components/form',
                title: '表单体系',
                icon: IconEdit,
                children: [
                    { key: '/form', title: 'ProForm', icon: IconEdit },
                    { key: '/modal', title: 'ProModal', icon: IconApps },
                    { key: '/upload', title: 'ProUpload', icon: IconUpload },
                ],
            },
        ],
    },
]);

// 取路由的 path 尾部字符串作为和 menu-item key 一致的判断依据
const selectedKeys = computed(() => [route.path]);
const getDefaultOpenKeysByRoute = (path: string) => {
    if (path === '/table' || path === '/pro-table-form') {
        return ['/components', '/components/table'];
    }
    if (path === '/form' || path === '/modal' || path === '/upload') {
        return ['/components', '/components/form'];
    }
    return ['/components'];
};

watch(
    () => route.path,
    (path) => {
        openKeys.value = getDefaultOpenKeysByRoute(path);
    },
    { immediate: true },
);

const handleOpenKeysChange = (keys: string[]) => {
    openKeys.value = keys;
};

// 处理菜单的点击拦截
const handleMenuClick = (menu: ProLayoutMenuItem) => {
    if (!menu?.key || menu.children?.length) return;
    if (menu.key !== route.path) {
        router.push({ path: menu.key });
    }
};
</script>

<style scoped>
:deep(.pro-layout-content-inner) {
    padding: 20px;
}
</style>
