import { describe, it, expect, beforeAll, vi } from 'vitest';

beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
});
import { mount } from '@vue/test-utils';
import ArcoVue from '@arco-design/web-vue';
import { nextTick } from 'vue';
import ProForm from '../index.vue';
import type { FormItemConfig } from '../types';

describe('ProForm Component', () => {
    // 基础渲染测试
    it('1. Schema解析与基础渲染: 渲染原生的 a-input 和 a-select', async () => {
        const items: FormItemConfig[] = [
            { component: 'input', name: 'username', label: '用户名' },
            {
                component: 'select',
                name: 'role',
                label: '角色',
                options: {
                    items: [{ label: '管理员', value: 'admin' }]
                }
            }
        ];

        const wrapper = mount(ProForm, {
            props: {
                modelValue: {},
                items,
            },
            global: {
                plugins: [ArcoVue]
            }
        });

        await nextTick();

        // 检验原生 arco class 是否存在，代表底层组件被正确渲染出
        expect(wrapper.find('.arco-input').exists()).toBe(true);
        expect(wrapper.find('.arco-select').exists()).toBe(true);
    });

    // 只读模式与字典 translation 测试
    it('2. 只读模式(Readonly)与字典翻译: 隐藏输入框并渲染文本', async () => {
        const items: FormItemConfig[] = [
            {
                component: 'select',
                name: 'status',
                label: '系统状态',
                options: {
                    items: [{ label: '启用', value: 1 }]
                }
            }
        ];

        const wrapper = mount(ProForm, {
            props: {
                modelValue: { status: 1 },
                items,
                readonly: true
            },
            global: {
                plugins: [ArcoVue]
            }
        });

        await nextTick();

        // 断言输入框组件被隐藏
        expect(wrapper.find('.arco-select').exists()).toBe(false);

        // 断言 readonly 组件呈现出了纯文本的字典翻译值 '启用'
        const readonlyText = wrapper.find('.pro-form-readonly-text');
        expect(readonlyText.exists()).toBe(true);
        expect(readonlyText.text()).toBe('启用');
    });
});
