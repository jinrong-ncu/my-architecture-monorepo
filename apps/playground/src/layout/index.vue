<template>
    <a-layout class="playground-layout">
        <!-- 顶部 Header 模块 -->
        <a-layout-header class="header">
            <div class="logo">
                <h2>Rong UI Playground</h2>
            </div>
        </a-layout-header>

        <!-- 主体区域划分 Sider 和 Content -->
        <a-layout>
            <a-layout-sider class="sider" :width="240" collapsible>
                <a-menu :default-selected-keys="[currentRoute]" @menu-item-click="handleMenuClick" style="width: 100%">
                    <a-menu-item key="table">
                        <template #icon><icon-layers /></template>
                        ProTable 演示
                    </a-menu-item>
                    <a-menu-item key="form">
                        <template #icon><icon-edit /></template>
                        ProForm 演示
                    </a-menu-item>
                    <a-menu-item key="modal">
                        <template #icon><icon-apps /></template>
                        ProModal 演示
                    </a-menu-item>
                    <a-menu-item key="upload">
                        <template #icon><icon-cloud-upload /></template>
                        ProUpload 演示
                    </a-menu-item>
                    <a-menu-item key="pro-table-form">
                        <template #icon><icon-table /></template>
                        ProTableForm 演示
                    </a-menu-item>
                </a-menu>
            </a-layout-sider>

            <a-layout-content class="content">
                <div class="content-wrapper">
                    <!-- 路由视口，渲染业务级组件 -->
                    <router-view />
                </div>
            </a-layout-content>
        </a-layout>
    </a-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

// 用于控制侧边栏的高亮和页面的路由切换
const router = useRouter();
const route = useRoute();

// 取路由的 path 尾部字符串作为和 menu-item key 一致的判断依据
const currentRoute = computed(() => {
    const path = route.path;
    return path.replace('/', '') || 'table';
});

// 处理菜单的点击拦截
const handleMenuClick = (key: string) => {
    router.push({ path: `/${key}` });
};
</script>

<style scoped>
.playground-layout {
    height: 100vh;
}

.header {
    height: 60px;
    background: var(--color-bg-2);
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    padding: 0 24px;
    box-sizing: border-box;
}

.logo h2 {
    margin: 0;
    color: rgb(var(--primary-6));
    /* 用 Arco 主色调点缀 */
    font-size: 20px;
    font-weight: 600;
}

.sider {
    background: var(--color-bg-2);
    border-right: 1px solid var(--color-border);
}

.content {
    background-color: var(--color-fill-2);
    padding: 24px;
    overflow-y: auto;
}

.content-wrapper {
    background: var(--color-bg-2);
    border-radius: 4px;
    padding: 24px;
    min-height: calc(100vh - 108px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    /* 稍加悬浮质感 */
}
</style>
