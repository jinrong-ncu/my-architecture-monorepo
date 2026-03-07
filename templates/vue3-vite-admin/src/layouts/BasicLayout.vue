<template>
    <a-layout class="basic-layout">
        <!-- ==================== 侧边栏 ==================== -->
        <a-layout-sider v-model:collapsed="collapsed" collapsible :width="220" class="layout-sider">
            <!-- Logo -->
            <div class="logo">
                <img src="/logo.svg" alt="logo" class="logo-img" />
                <span v-if="!collapsed" class="logo-text">{{ appName }}</span>
            </div>

            <!-- 导航菜单 -->
            <a-menu :selected-keys="[currentRoute]" theme="dark" style="flex: 1; overflow-y: auto;"
                @menu-item-click="handleMenuClick">
                <a-menu-item v-for="route in menuRoutes" :key="route.path">
                    <template #icon>
                        <component :is="route.meta?.icon || 'icon-apps'" />
                    </template>
                    {{ route.meta?.title }}
                </a-menu-item>
            </a-menu>
        </a-layout-sider>

        <a-layout>
            <!-- ==================== 顶部 Header ==================== -->
            <a-layout-header class="layout-header">
                <a-space>
                    <a-breadcrumb>
                        <a-breadcrumb-item>首页</a-breadcrumb-item>
                        <a-breadcrumb-item>{{ pageTitle }}</a-breadcrumb-item>
                    </a-breadcrumb>
                </a-space>
                <div class="header-right">
                    <a-avatar :size="32" style="background-color: var(--color-primary-6);">管</a-avatar>
                </div>
            </a-layout-header>

            <!-- ==================== 主内容区 ==================== -->
            <a-layout-content class="layout-content">
                <router-view />
            </a-layout-content>
        </a-layout>
    </a-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const collapsed = ref(false);
const appName = '{{name}}';

// 从路由表动态生成菜单（只显示带 meta.title 的路由）
const menuRoutes = computed(() =>
    router.getRoutes()
        .filter(r => r.meta?.title && !r.meta?.hidden)
);

const currentRoute = computed(() => route.path.replace('/', ''));
const pageTitle = computed(() => route.meta?.title as string || '');

function handleMenuClick(key: string) {
    router.push('/' + key);
}
</script>

<style scoped>
.basic-layout {
    height: 100vh;
    overflow: hidden;
}

.layout-sider {
    background: #001529;
    display: flex;
    flex-direction: column;
}

.logo {
    height: 64px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    overflow: hidden;
}

.logo-img {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
}

.logo-text {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    white-space: nowrap;
}

.layout-header {
    background: var(--color-bg-1);
    border-bottom: 1px solid var(--color-border-2);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    height: 64px;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.layout-content {
    padding: 24px;
    overflow-y: auto;
    background: var(--color-bg-2);
}
</style>
