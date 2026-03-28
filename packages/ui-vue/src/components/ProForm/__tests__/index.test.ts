import { describe, it, expect, beforeAll, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ArcoVue from '@arco-design/web-vue';
import { nextTick } from 'vue';
import ProForm from '../index.vue';
import type { FormItemConfig } from '../types';

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

// 通用挂载配置封装
const mountProForm = (props: any, slots?: any) => {
    return mount(ProForm, {
        props,
        slots,
        global: {
            plugins: [ArcoVue],
            stubs: {
                'icon-question-circle': true,
                'icon-file': true,
                'a-image': true,
                ProUpload: true
            }
        }
    });
};

describe('ProForm Component', () => {

    it('1. 基础组件全量渲染测试', async () => {
        const items: FormItemConfig[] = [
            { component: 'input', name: 'f1', label: '1' },
            { component: 'textarea', name: 'f2', label: '2' },
            { component: 'select', name: 'f3', label: '3', options: { items: [] } },
            { component: 'cascader', name: 'f4', label: '4' },
            { component: 'radio', name: 'f5', label: '5', options: { items: [] } },
            { component: 'checkboxGroup', name: 'f6', label: '6', options: { items: [] } },
            { component: 'date', name: 'f7', label: '7' },
            { component: 'number', name: 'f8', label: '8' },
            { component: 'switch', name: 'f9', label: '9' },
            { component: 'color', name: 'f10', label: '10' },
            { component: 'rate', name: 'f11', label: '11' },
            { component: 'slider', name: 'f12', label: '12' }
        ];

        const wrapper = mountProForm({ modelValue: {}, items });
        await nextTick();

        // 通过校验外层的 .arco-form-item 数量，来准确判断这 12 种配置项都经过了分发并产生包裹容器
        // 因为 arco 内部组件类名可能会因子组件渲染态而丢失或改变（如 cascader）
        const formItems = wrapper.findAll('.arco-form-item');
        expect(formItems.length).toBe(12);
    });

    it('2. 只读模式(Readonly)多场景字典翻译', async () => {
        const items: FormItemConfig[] = [
            { component: 'select', name: 'status', label: '状态', options: { items: [{ label: '启用', value: 1 }] } },
            { component: 'cascader', name: 'city', label: '城市', options: { items: [{ label: '浙江', value: 'zj', children: [{ label: '杭州', value: 'hz' }] }] } },
            { component: 'switch', name: 'isOpen', label: '开关' },
            { component: 'checkbox', name: 'isAgree', label: '同意' },
            { component: 'upload', name: 'file', label: '文件' }
        ];

        const modelValue = {
            status: 1,
            city: ['zj', 'hz'],
            isOpen: true,
            isAgree: false,
            file: { name: 'test.png', url: 'http://img.png' }
        };

        const wrapper = mountProForm({ modelValue, items, readonly: true });
        await nextTick();

        const readonlyNodes = wrapper.findAll('.pro-form-readonly-text');

        // select 翻译
        expect(readonlyNodes[0].text()).toBe('启用');
        // cascader 翻译
        expect(readonlyNodes[1].text()).toBe('浙江 / 杭州');
        // switch 翻译
        expect(readonlyNodes[2].text()).toBe('开启');
        // checkbox 翻译
        expect(readonlyNodes[3].text()).toBe('否');

        // upload 渲染
        const uploadLinks = wrapper.findAll('.pro-form-readonly-upload__name');
        expect(uploadLinks.length).toBe(1);
        expect(uploadLinks[0].text()).toBe('test.png');
    });

    it('3. 嵌套深度数据绑定 (options.name)', async () => {
        const items: FormItemConfig[] = [
            { component: 'input', name: 'user', label: '嵌套姓名', options: { name: 'username' } }
        ];

        const wrapper = mountProForm({
            modelValue: { user: { username: 'Rong' } },
            items
        });
        await nextTick();

        const input = wrapper.find('input');
        expect(input.element.value).toBe('Rong');

        // 模拟外部赋值触发更新
        await wrapper.setProps({ modelValue: { user: { username: 'Shiyi' } } });
        await nextTick();
        expect(input.element.value).toBe('Shiyi');
    });

    it('4. 动态显隐控制 (hideHandle)', async () => {
        const items: FormItemConfig[] = [
            { component: 'input', name: 'type', label: '类型' },
            { component: 'input', name: 'hiddenField', label: '隐藏字段', hideHandle: "$.type === 'hide'" }
        ];

        const wrapper = mountProForm({
            modelValue: { type: 'show' },
            items
        });
        await nextTick();

        // 此时由于 type !== 'hide'，隐藏字段应该显示
        expect(wrapper.html()).toContain('隐藏字段');

        // 修改 type 触发隐藏
        await wrapper.setProps({ modelValue: { type: 'hide' } });
        await nextTick();

        expect(wrapper.html()).not.toContain('隐藏字段');
    });

    it('5. 动态必填规则 (requiredHandle)', async () => {
        const items: FormItemConfig[] = [
            { component: 'input', name: 'type', label: '类型' },
            { component: 'input', name: 'dynamicRequired', label: '动态必填', requiredHandle: "$.type === 'need'" }
        ];

        const wrapper = mountProForm({
            modelValue: { type: 'need' },
            items
        });
        await nextTick();

        // 当 type 为 need 时，应用了必填的 arco 类 (*对应的DOM标记)
        expect(wrapper.html()).toContain('arco-form-item-label-required');

        // 切换回不需要必填
        await wrapper.setProps({ modelValue: { type: 'none' } });
        await nextTick();

        expect(wrapper.html()).not.toContain('arco-form-item-label-required');
    });

    it('6. 自定义插槽渲染 fallback', async () => {
        const items: FormItemConfig[] = [
            { component: 'myCustomSlot', name: 'customData', label: '自定义' }
        ];

        const wrapper = mountProForm({ modelValue: { customData: '123' }, items }, {
            myCustomSlot: '<div class="my-custom-slot">Slot Content</div>'
        });
        await nextTick();

        expect(wrapper.find('.my-custom-slot').exists()).toBe(true);
        expect(wrapper.find('.my-custom-slot').text()).toBe('Slot Content');
    });

    it('7. Tags 标签交互逻辑', async () => {
        const items: FormItemConfig[] = [
            { component: 'tags', name: 'tagsList', label: '标签' }
        ];

        const wrapper = mountProForm({ modelValue: { tagsList: ['TagA'] }, items });
        await nextTick();

        // 验证初始渲染
        const tags = wrapper.findAll('.arco-tag');
        expect(tags.length).toBe(1);
        expect(tags[0].text()).toContain('TagA');

        // 模拟输入并回车添加新 Tag
        const input = wrapper.find('.pro-form-tags input');
        await input.setValue('TagB');
        await input.trigger('keyup.enter');

        await nextTick();

        // 验证组件内部状态更新触发了 Emit
        const emits = wrapper.emitted('update:modelValue') as any[];
        expect(emits).toBeTruthy();

        const lastEmit = emits[emits.length - 1][0];
        expect(lastEmit.tagsList).toContain('TagB');
    });
});
