import type { Component } from 'vue';

export interface ProLayoutMenuItem {
    key: string;
    title: string;
    icon?: string | Component;
    children?: ProLayoutMenuItem[];
}

export interface ProLayoutProps {
    title?: string;
    logo?: string;
    menus?: ProLayoutMenuItem[];
    collapsed?: boolean;
    selectedKeys?: string[];
    openKeys?: string[];
}

export interface ProLayoutEmits {
    (event: 'update:collapsed', value: boolean): void;
    (event: 'update:openKeys', value: string[]): void;
    (event: 'menu-click', menu: ProLayoutMenuItem): void;
}
