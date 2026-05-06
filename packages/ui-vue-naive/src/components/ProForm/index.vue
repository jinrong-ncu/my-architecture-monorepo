<template>
    <div class="my-org-pro-form">
        <n-form
            ref="formRef"
            :model="formData"
            :rules="computedRules"
            :label-placement="config?.labelPlacement || 'left'"
            :label-align="config?.labelAlign || 'right'"
            :label-width="config?.labelWidth || 'auto'"
        >
            <n-grid :x-gap="config?.xGap || 16" :y-gap="config?.yGap || 0" :cols="24">
                <template v-for="item in items" :key="item.name + (item.options?.name || '')">
                    <!-- ① Divider 分组隔离标题带 -->
                    <n-grid-item v-if="item.component === 'divider'" :span="24">
                        <div class="pro-form-divider">
                            <span class="pro-form-divider__title">{{ item.label }}</span>
                            <n-tooltip v-if="item.tips" trigger="hover">
                                <template #trigger>
                                    <n-icon class="pro-form-divider__icon">
                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14h-2v-2h2zm0-4h-2V7h2z"/>
                                        </svg>
                                    </n-icon>
                                </template>
                                {{ item.tips }}
                            </n-tooltip>
                            <n-divider style="margin: 0; flex: 1; min-width: 40px;" />
                        </div>
                    </n-grid-item>

                    <!-- ② 普通表单项（受 checkHide 控制是否显示） -->
                    <n-grid-item v-else-if="!checkHide(item)" :span="item.span || 24">
                        <n-form-item :path="getPropName(item)">
                            <!-- 标签插槽：支持 tips tooltip 注入 -->
                            <template #label>
                                <span>{{ item.label }}</span>
                                <n-tooltip v-if="item.tips" trigger="hover" placement="top">
                                    <template #trigger>
                                        <n-icon class="pro-form-label-icon">
                                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                                            </svg>
                                        </n-icon>
                                    </template>
                                    {{ item.tips }}
                                </n-tooltip>
                            </template>

                            <!-- 只读模式 -->
                            <template v-if="props.readonly">
                                <div class="pro-form-readonly-text">{{ renderReadonlyText(item, getModelRef(item).value) }}</div>
                            </template>

                            <!-- ======= 内部组件智能分发 ======= -->
                            <template v-else>
                                <!-- input 单行文本框 -->
                                <template v-if="item.component === 'input'">
                                    <n-input
                                        v-model:value="getModelRef(item).value"
                                        :placeholder="item.options?.placeholder || `请输入${item.label}`"
                                        :disabled="item.options?.disabled"
                                        :type="item.options?.type || 'text'"
                                        :maxlength="item.options?.maxlength"
                                        :clearable="item.options?.clearable !== false"
                                        v-bind="getRestOptions(item)"
                                    />
                                </template>

                                <!-- textarea 多行文本框 -->
                                <template v-else-if="item.component === 'textarea'">
                                    <n-input
                                        type="textarea"
                                        v-model:value="getModelRef(item).value"
                                        :placeholder="item.options?.placeholder || `请输入${item.label}`"
                                        :disabled="item.options?.disabled"
                                        :maxlength="item.options?.maxlength"
                                        :clearable="item.options?.clearable !== false"
                                        :autosize="{ minRows: 3, maxRows: 6 }"
                                        v-bind="getRestOptions(item)"
                                    />
                                </template>

                                <!-- select 下拉选择 -->
                                <template v-else-if="item.component === 'select'">
                                    <n-select
                                        v-model:value="getModelRef(item).value"
                                        :options="item.options?.items || []"
                                        :placeholder="item.options?.placeholder || `请选择${item.label}`"
                                        :disabled="item.options?.disabled"
                                        :multiple="item.options?.multiple"
                                        :clearable="item.options?.clearable !== false"
                                        v-bind="getRestOptions(item)"
                                    />
                                </template>

                                <!-- cascader 级联选择 -->
                                <template v-else-if="item.component === 'cascader'">
                                    <n-cascader
                                        v-model:value="getModelRef(item).value"
                                        :options="item.options?.items || []"
                                        :placeholder="item.options?.placeholder || `请选择${item.label}`"
                                        :disabled="item.options?.disabled"
                                        :multiple="item.options?.multiple"
                                        :clearable="item.options?.clearable !== false"
                                        v-bind="getRestOptions(item)"
                                    />
                                </template>

                                <!-- radio 单选组 -->
                                <template v-else-if="item.component === 'radio'">
                                    <n-radio-group v-model:value="getModelRef(item).value" :disabled="item.options?.disabled" v-bind="getRestOptions(item)">
                                        <n-space>
                                            <n-radio
                                                v-for="opt in item.options?.items"
                                                :key="opt.value"
                                                :value="opt.value"
                                                :disabled="opt.disabled"
                                            >
                                                {{ opt.label }}
                                            </n-radio>
                                        </n-space>
                                    </n-radio-group>
                                </template>

                                <!-- checkboxGroup 多选组 -->
                                <template v-else-if="item.component === 'checkboxGroup'">
                                    <n-checkbox-group v-model:value="getModelRef(item).value" :disabled="item.options?.disabled" v-bind="getRestOptions(item)">
                                        <n-space>
                                            <n-checkbox
                                                v-for="opt in item.options?.items"
                                                :key="opt.value"
                                                :value="opt.value"
                                                :disabled="opt.disabled"
                                            >
                                                {{ opt.label }}
                                            </n-checkbox>
                                        </n-space>
                                    </n-checkbox-group>
                                </template>

                                <!-- checkbox 单个多选框 -->
                                <template v-else-if="item.component === 'checkbox'">
                                    <n-checkbox v-model:checked="getModelRef(item).value" :disabled="item.options?.disabled" v-bind="getRestOptions(item)">
                                        {{ item.options?.label || item.label }}
                                    </n-checkbox>
                                </template>

                                <!-- date 日期选择器 -->
                                <template v-else-if="item.component === 'date'">
                                    <n-date-picker
                                        v-model:formatted-value="getModelRef(item).value"
                                        value-format="yyyy-MM-dd HH:mm:ss"
                                        :type="(item.options?.type || 'date') as any"
                                        :placeholder="item.options?.placeholder || `请选择${item.label}`"
                                        :disabled="item.options?.disabled"
                                        :clearable="item.options?.clearable !== false"
                                        style="width: 100%"
                                        v-bind="getRestOptions(item)"
                                    />
                                </template>

                                <!-- number 数字输入框 -->
                                <template v-else-if="item.component === 'number'">
                                    <n-input-number
                                        v-model:value="getModelRef(item).value"
                                        :placeholder="item.options?.placeholder || `请输入${item.label}`"
                                        :disabled="item.options?.disabled"
                                        :min="item.options?.min"
                                        :max="item.options?.max"
                                        :step="item.options?.step"
                                        :clearable="item.options?.clearable !== false"
                                        style="width: 100%"
                                        v-bind="getRestOptions(item)"
                                    />
                                </template>

                                <!-- switch 开关 -->
                                <template v-else-if="item.component === 'switch'">
                                    <n-switch v-model:value="getModelRef(item).value" :disabled="item.options?.disabled" v-bind="getRestOptions(item)" />
                                </template>

                                <!-- color 颜色选择器 -->
                                <template v-else-if="item.component === 'color'">
                                    <n-color-picker v-model:value="getModelRef(item).value" :disabled="item.options?.disabled" v-bind="getRestOptions(item)" />
                                </template>

                                <!-- rate 评分 -->
                                <template v-else-if="item.component === 'rate'">
                                    <n-rate
                                        v-model:value="getModelRef(item).value"
                                        :count="item.options?.count"
                                        :allow-half="item.options?.allowHalf"
                                        :disabled="item.options?.disabled"
                                        v-bind="getRestOptions(item)"
                                    />
                                </template>

                                <!-- slider 滑块 -->
                                <template v-else-if="item.component === 'slider'">
                                    <n-slider
                                        v-model:value="getModelRef(item).value"
                                        :min="item.options?.min || 0"
                                        :max="item.options?.max || 100"
                                        :step="item.options?.step || 1"
                                        :disabled="item.options?.disabled"
                                        v-bind="getRestOptions(item)"
                                    />
                                </template>

                                <!-- tags 标签输入 -->
                                <template v-else-if="item.component === 'tags'">
                                    <n-dynamic-tags v-model:value="getModelRef(item).value" :disabled="item.options?.disabled" v-bind="getRestOptions(item)" />
                                </template>

                                <!-- upload 文件上传（通过简单版 ProUpload 封装） -->
                                <template v-else-if="item.component === 'upload'">
                                    <ProUpload 
                                        v-model="getModelRef(item).value"
                                        :list-type="item.options?.listType || 'text'"
                                        :accept="item.options?.accept"
                                        :limit="item.options?.limit"
                                        :api-obj="item.options?.apiObj"
                                        :disabled="item.options?.disabled"
                                    />
                                </template>

                                <!-- 兜底：任何未识别 component 字符串 => 渲染具名插槽 -->
                                <template v-else>
                                    <slot
                                        :name="item.component"
                                        :item="item"
                                        :model="formData"
                                        :modelRef="getModelRef(item)"
                                    />
                                </template>
                            </template>
                        </n-form-item>
                        
                        <!-- 底部额外说明 -->
                        <div v-if="item.message && !props.readonly" class="pro-form-message">{{ item.message }}</div>
                    </n-grid-item>
                </template>

                <!-- 行动区插槽，用于放置提交/重置按钮 -->
                <n-grid-item v-if="!props.readonly" :span="24">
                    <div class="pro-form-actions">
                        <slot name="action" :form="formRef" :model="formData" />
                    </div>
                </n-grid-item>
            </n-grid>
        </n-form>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, reactive, onMounted, computed } from 'vue';
import {
    NForm, NFormItem, NGrid, NGridItem, NInput, NSelect, NCascader, NRadioGroup, NRadio, NSpace,
    NCheckboxGroup, NCheckbox, NDatePicker, NInputNumber, NSwitch, NColorPicker, NRate, NSlider,
    NDynamicTags, NTooltip, NIcon, NDivider
} from 'naive-ui';
import type { FormInst, FormRules } from 'naive-ui';
import type { FormItemConfig, ProFormProps } from './types';
import ProUpload from '../ProUpload/index.vue';

// ==========================================
// 1. Props & Emits
// ==========================================
const props = defineProps<ProFormProps>();
const emit = defineEmits(['update:modelValue', 'submit']);

const formRef = ref<FormInst | null>(null);
const formData = reactive<Record<string, any>>({});

// ==========================================
// 2. 深度合并初始化
// ==========================================
function deepMerge(dst: Record<string, any>, src: Record<string, any>) {
    for (const key in src) {
        if (src[key] !== null && typeof src[key] === 'object' && !Array.isArray(src[key])) {
            if (!dst[key]) dst[key] = {};
            deepMerge(dst[key], src[key]);
        } else {
            dst[key] = src[key];
        }
    }
}

function initFormData() {
    deepMerge(formData, props.modelValue || {});
    props.items.forEach(item => {
        if (item.name && item.options?.name) {
            if (!formData[item.name]) formData[item.name] = {};
        }
    });
}

onMounted(initFormData);

watch(() => props.modelValue, (newVal) => {
    deepMerge(formData, newVal || {});
}, { deep: true });

watch(formData, (newVal) => {
    emit('update:modelValue', { ...newVal });
}, { deep: true });

// ==========================================
// 3. 核心工具函数
// ==========================================
function getPropName(item: FormItemConfig): string {
    if (item.options?.name) return `${item.name}.${item.options.name}`;
    return item.name;
}

function getModelRef(item: FormItemConfig) {
    const parent = item.name;
    const child = item.options?.name;

    if (child) {
        if (!formData[parent]) formData[parent] = {};
        return {
            get value() { return formData[parent][child]; },
            set value(v: any) { formData[parent][child] = v; }
        };
    }
    return {
        get value() { return formData[parent]; },
        set value(v: any) { formData[parent] = v; }
    };
}

function getRestOptions(item: FormItemConfig) {
    const { name, placeholder, disabled, type, maxlength, multiple, clearable, items, format, min, max, step, allowHalf, count, ...rest } = item.options || {};
    return rest;
}

function isEmptyValue(value: unknown): boolean {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
}

function isSameValue(left: unknown, right: unknown): boolean {
    return left === right || String(left) === String(right);
}

function findLabelByValue(options: Array<{ label: string; value: any }> = [], targetValue: unknown): string | undefined {
    const matched = options.find(option => isSameValue(option.value, targetValue));
    return matched?.label;
}

function getCascaderPathLabel(options: Array<{ label: string; value: any; children?: any[] }> = [], pathValues: unknown): string {
    if (!Array.isArray(pathValues) || pathValues.length === 0) return '-';
    const labels: string[] = [];
    let currentOptions = options;
    for (const value of pathValues) {
        const matched = currentOptions.find(option => isSameValue(option.value, value));
        if (!matched) return '-';
        labels.push(matched.label);
        currentOptions = Array.isArray(matched.children) ? matched.children : [];
    }
    return labels.length ? labels.join(' / ') : '-';
}

function renderReadonlyText(item: FormItemConfig, rawValue: unknown): string {
    if (isEmptyValue(rawValue)) return '-';
    const component = item.component;
    const options = item.options?.items || [];

    if (component === 'select' || component === 'radio' || component === 'checkboxGroup') {
        if (Array.isArray(rawValue)) {
            const labels = rawValue
                .map(value => findLabelByValue(options, value))
                .filter((label): label is string => !!label && label.trim().length > 0);
            return labels.length ? labels.join('、') : '-';
        }
        const label = findLabelByValue(options, rawValue);
        return label && label.trim().length > 0 ? label : '-';
    }

    if (component === 'cascader') {
        if (!Array.isArray(rawValue)) return '-';
        if (rawValue.length > 0 && Array.isArray(rawValue[0])) {
            const pathTexts = (rawValue as unknown[])
                .map(path => getCascaderPathLabel(options, path))
                .filter(text => text !== '-');
            return pathTexts.length ? pathTexts.join('；') : '-';
        }
        return getCascaderPathLabel(options, rawValue);
    }

    if (component === 'checkbox') return rawValue ? '是' : '否';
    if (component === 'switch') return rawValue ? '开启' : '关闭';

    if (Array.isArray(rawValue)) return rawValue.join('、');
    return String(rawValue);
}

// ==========================================
// 4. 动态显隐引擎
// ==========================================
function checkHide(item: FormItemConfig): boolean {
    const handle = item.hideHandle;
    if (handle === undefined || handle === null) return false;
    if (typeof handle === 'boolean') return handle;
    try {
        const fn = new Function('form', `return (${handle.replace(/\$/g, 'form')})`);
        return !!fn(formData);
    } catch (e) {
        console.warn('[ProForm] hideHandle 解析失败:', handle, e);
        return false;
    }
}

// ==========================================
// 5. 动态校验规则引擎
// ==========================================
const computedRules = computed<FormRules>(() => {
    const rulesObj: FormRules = {};
    props.items.forEach(item => {
        if (checkHide(item) || item.component === 'divider') return;
        
        const path = getPropName(item);
        let rules = item.rules ? (Array.isArray(item.rules) ? [...item.rules] : [item.rules]) : [];
        
        if (item.requiredHandle) {
            try {
                const fn = new Function('form', `return (${item.requiredHandle.replace(/\$/g, 'form')})`);
                const isRequired = !!fn(formData);
                const requiredRule = rules.find(r => 'required' in r);
                if (requiredRule) {
                    (requiredRule as any).required = isRequired;
                } else if (isRequired) {
                    rules.unshift({ required: true, message: `${item.label}不能为空`, trigger: ['blur', 'change'] });
                }
            } catch (e) {
                console.warn('[ProForm] requiredHandle 解析失败:', item.requiredHandle, e);
            }
        }
        
        if (rules.length > 0) {
            rulesObj[path] = rules;
        }
    });
    return rulesObj;
});

// ==========================================
// 6. 暴露实例方法
// ==========================================
defineExpose({
    formInst: formRef,
    validate: (callback?: (errors?: Array<any>) => void) => formRef.value?.validate(callback),
    restoreValidation: () => formRef.value?.restoreValidation(),
});
</script>

<style scoped>
.my-org-pro-form {
    width: 100%;
}

.pro-form-divider {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px 0 8px;
}

.pro-form-divider__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--n-text-color);
    white-space: nowrap;
}

.pro-form-divider__icon {
    color: var(--n-text-color-3);
    cursor: pointer;
    flex-shrink: 0;
}

.pro-form-label-icon {
    margin-left: 4px;
    color: var(--n-text-color-3);
    cursor: pointer;
    vertical-align: middle;
}

.pro-form-message {
    font-size: 12px;
    color: var(--n-text-color-3);
    margin-top: -16px;
    margin-bottom: 8px;
    padding-left: 2px;
    line-height: 1.6;
}

.pro-form-actions {
    margin-top: 16px;
    display: flex;
    justify-content: flex-start;
}

.pro-form-readonly-text {
    min-height: 32px;
    line-height: 32px;
    color: var(--n-text-color);
    white-space: pre-wrap;
    word-break: break-word;
}
</style>
