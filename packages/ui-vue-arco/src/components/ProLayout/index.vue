<template>
    <a-layout class="pro-layout">
        <a-layout-sider class="pro-layout-sider" :collapsed="mergedCollapsed" :width="220" :collapsed-width="56"
            :breakpoint="'lg'" collapsible :trigger="null" @collapse="handleSiderCollapse">
            <div class="pro-layout-logo-wrap" :class="{ collapsed: mergedCollapsed }">
                <img v-if="props.logo" :src="props.logo" alt="logo" class="pro-layout-logo" />
                <div v-else class="pro-layout-logo-placeholder">R</div>
                <transition name="fade-slide">
                    <span v-if="!mergedCollapsed" class="pro-layout-title">{{ props.title || 'Rong Admin' }}</span>
                </transition>
            </div>

            <a-menu :collapsed="mergedCollapsed" :selected-keys="props.selectedKeys || []"
                :open-keys="mergedOpenKeys" :auto-open="false" class="pro-layout-menu"
                @menu-item-click="handleMenuItemClick" @update:open-keys="handleOpenKeysChange">
                <template v-for="menu in props.menus || []" :key="menu.key">
                    <MenuNode :menu="menu" />
                </template>
            </a-menu>
        </a-layout-sider>

        <a-layout class="pro-layout-main">
            <a-layout-header class="pro-layout-header">
                <div class="pro-layout-header-left">
                    <a-button type="text" class="pro-layout-trigger" @click="toggleCollapse">
                        <template #icon>
                            <icon-menu-unfold v-if="mergedCollapsed" />
                            <icon-menu-fold v-else />
                        </template>
                    </a-button>
                </div>
                <div class="pro-layout-header-right">
                    <slot name="header-right"></slot>
                </div>
            </a-layout-header>

            <a-layout-content class="pro-layout-content">
                <div class="pro-layout-content-inner">
                    <slot></slot>
                </div>
            </a-layout-content>
        </a-layout>
    </a-layout>
</template>

<script setup lang="ts">
import {
    computed,
    defineComponent,
    h,
    ref,
    resolveComponent,
    resolveDynamicComponent,
    type PropType,
} from 'vue';
import type { ProLayoutEmits, ProLayoutMenuItem, ProLayoutProps } from './types';

const props = withDefaults(defineProps<ProLayoutProps>(), {
    title: 'Rong Admin',
    logo: '',
    menus: () => [],
    collapsed: false,
    selectedKeys: () => [],
});

const emit = defineEmits<ProLayoutEmits>();

function resolveMenuIcon(icon?: string | object) {
    if (!icon) return null;
    return typeof icon === 'string' ? resolveDynamicComponent(icon) : icon;
}

const MenuNode = defineComponent({
    name: 'MenuNode',
    props: {
        menu: {
            type: Object as PropType<ProLayoutMenuItem>,
            required: true,
        },
    },
    setup(nodeProps) {
        return () => {
            const menu = nodeProps.menu;
            const iconComponent = resolveMenuIcon(menu.icon);
            const iconSlot = iconComponent ? () => h(iconComponent as any) : undefined;
            const hasChildren = Array.isArray(menu.children) && menu.children.length > 0;

            if (hasChildren) {
                return h(
                    resolveComponent('a-sub-menu') as any,
                    { key: menu.key },
                    {
                        icon: iconSlot,
                        title: () => menu.title,
                        default: () =>
                            (menu.children || []).map(child =>
                                h(MenuNode, {
                                    key: child.key,
                                    menu: child,
                                }),
                            ),
                    },
                );
            }

            return h(
                resolveComponent('a-menu-item') as any,
                { key: menu.key },
                {
                    icon: iconSlot,
                    default: () => menu.title,
                },
            );
        };
    },
});

const mergedCollapsed = computed(() => !!props.collapsed);
const innerOpenKeys = ref<string[]>([]);
const mergedOpenKeys = computed(() => (Array.isArray(props.openKeys) ? props.openKeys : innerOpenKeys.value));

function toggleCollapse() {
    emit('update:collapsed', !mergedCollapsed.value);
}

function handleSiderCollapse(value: boolean) {
    emit('update:collapsed', value);
}

function handleOpenKeysChange(nextOpenKeys: string[]) {
    innerOpenKeys.value = nextOpenKeys;
    emit('update:openKeys', nextOpenKeys);
}

function findMenuByKey(menus: ProLayoutMenuItem[], key: string): ProLayoutMenuItem | undefined {
    for (const menu of menus) {
        if (menu.key === key) return menu;
        if (menu.children?.length) {
            const hit = findMenuByKey(menu.children, key);
            if (hit) return hit;
        }
    }
    return undefined;
}

function handleMenuItemClick(key: string) {
    const hit = findMenuByKey(props.menus || [], key);
    if (hit) {
        emit('menu-click', hit);
    }
}
</script>

<style scoped>
.pro-layout {
    height: 100vh;
    background: var(--color-fill-2);
}

.pro-layout-sider {
    border-right: 1px solid var(--color-border-2);
    background: var(--color-bg-2);
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.04);
    transition: width 0.24s ease;
    z-index: 10;
}

.pro-layout-logo-wrap {
    height: 56px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 14px;
    border-bottom: 1px solid var(--color-border-2);
    overflow: hidden;
    background: linear-gradient(120deg, rgba(22, 93, 255, 0.08), rgba(114, 46, 209, 0.06));
}

.pro-layout-logo-wrap.collapsed {
    justify-content: center;
    padding: 0;
}

.pro-layout-logo {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    object-fit: cover;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.pro-layout-logo-placeholder {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(135deg, rgb(var(--primary-6)), rgb(var(--arcoblue-4)));
}

.pro-layout-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-1);
    white-space: nowrap;
}

.pro-layout-menu {
    padding: 10px 8px;
    background: transparent;
}

.pro-layout-main {
    min-width: 0;
}

.pro-layout-header {
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    background: var(--color-bg-2);
    border-bottom: 1px solid var(--color-border-2);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

.pro-layout-header-left,
.pro-layout-header-right {
    display: flex;
    align-items: center;
    gap: 10px;
}

.pro-layout-trigger {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    transition: all 0.2s ease;
}

.pro-layout-trigger:hover {
    background: var(--color-fill-2);
}

.pro-layout-content {
    padding: 16px;
    background: var(--color-fill-2);
    overflow: auto;
}

.pro-layout-content-inner {
    min-height: calc(100vh - 88px);
    background: var(--color-bg-2);
    border-radius: 10px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    padding: 16px;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
    opacity: 0;
    transform: translateX(-6px);
}
</style>
