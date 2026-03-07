<template>
    <div class="rong-pro-form">
        <a-form ref="formRef" :model="formData" :layout="config?.labelPosition || 'horizontal'"
            :auto-label-width="config?.autoLabelWidth !== false" label-align="left" @submit="handleSubmit">
            <a-row :gutter="15">
                <template v-for="item in items" :key="item.name + (item.options?.name || '')">

                    <!-- ① Divider 分组隔离标题带 -->
                    <a-col v-if="item.component === 'divider'" :span="24">
                        <div class="pro-form-divider">
                            <span class="pro-form-divider__title">{{ item.label }}</span>
                            <a-tooltip v-if="item.tips" :content="item.tips">
                                <icon-question-circle class="pro-form-divider__icon" />
                            </a-tooltip>
                            <a-divider style="margin: 0; flex: 1; min-width: 40px;" />
                        </div>
                    </a-col>

                    <!-- ② 普通表单项（受 checkHide 控制是否显示） -->
                    <a-col v-else-if="!checkHide(item)" :span="item.span || 24">
                        <a-form-item :field="getPropName(item)" :rules="getRules(item)">

                            <!-- 标签插槽：支持 tips tooltip 注入 -->
                            <template #label>
                                <span>{{ item.label }}</span>
                                <a-tooltip v-if="item.tips" :content="item.tips" position="top">
                                    <icon-question-circle class="pro-form-label-icon" />
                                </a-tooltip>
                            </template>

                            <!-- ======= 内部组件智能分发 ======= -->

                            <!-- input 单行文本框 -->
                            <template v-if="item.component === 'input'">
                                <a-input v-model="getModelRef(item).value" :placeholder="item.options?.placeholder"
                                    :disabled="item.options?.disabled" :type="item.options?.type"
                                    :max-length="item.options?.maxlength" allow-clear />
                            </template>

                            <!-- textarea 多行文本框 -->
                            <template v-else-if="item.component === 'textarea'">
                                <a-textarea v-model="getModelRef(item).value" :placeholder="item.options?.placeholder"
                                    :disabled="item.options?.disabled" :max-length="item.options?.maxlength"
                                    :auto-size="{ minRows: 3, maxRows: 6 }" allow-clear />
                            </template>

                            <!-- select 下拉选择 -->
                            <template v-else-if="item.component === 'select'">
                                <a-select v-model="getModelRef(item).value" :placeholder="item.options?.placeholder"
                                    :disabled="item.options?.disabled" :multiple="item.options?.multiple" allow-clear
                                    style="width: 100%">
                                    <a-option v-for="opt in item.options?.items" :key="opt.value" :value="opt.value"
                                        :label="opt.label" :disabled="opt.disabled" />
                                </a-select>
                            </template>

                            <!-- cascader 级联选择 -->
                            <template v-else-if="item.component === 'cascader'">
                                <a-cascader v-model="getModelRef(item).value" :options="item.options?.items || []"
                                    :placeholder="item.options?.placeholder" :disabled="item.options?.disabled"
                                    :multiple="item.options?.multiple" allow-clear style="width: 100%" />
                            </template>

                            <!-- radio 单选组 -->
                            <template v-else-if="item.component === 'radio'">
                                <a-radio-group v-model="getModelRef(item).value" :disabled="item.options?.disabled">
                                    <a-radio v-for="opt in item.options?.items" :key="opt.value" :value="opt.value"
                                        :disabled="opt.disabled">
                                        {{ opt.label }}
                                    </a-radio>
                                </a-radio-group>
                            </template>

                            <!-- checkboxGroup 多选组 -->
                            <template v-else-if="item.component === 'checkboxGroup'">
                                <a-checkbox-group v-model="getModelRef(item).value" :disabled="item.options?.disabled">
                                    <a-checkbox v-for="opt in item.options?.items" :key="opt.value" :value="opt.value"
                                        :disabled="opt.disabled">
                                        {{ opt.label }}
                                    </a-checkbox>
                                </a-checkbox-group>
                            </template>

                            <!-- date 日期选择器 -->
                            <template v-else-if="item.component === 'date'">
                                <a-date-picker v-model="getModelRef(item).value"
                                    :placeholder="item.options?.placeholder" :disabled="item.options?.disabled"
                                    :format="item.options?.format" :show-time="item.options?.showTime"
                                    style="width: 100%" allow-clear />
                            </template>

                            <!-- number 数字输入框 -->
                            <template v-else-if="item.component === 'number'">
                                <a-input-number v-model="getModelRef(item).value"
                                    :placeholder="item.options?.placeholder" :disabled="item.options?.disabled"
                                    :min="item.options?.min" :max="item.options?.max" :step="item.options?.step"
                                    style="width: 100%" />
                            </template>

                            <!-- switch 开关 -->
                            <template v-else-if="item.component === 'switch'">
                                <a-switch v-model="getModelRef(item).value" :disabled="item.options?.disabled" />
                            </template>

                            <!-- color 颜色选择器 -->
                            <template v-else-if="item.component === 'color'">
                                <a-color-picker v-model="getModelRef(item).value" :disabled="item.options?.disabled" />
                            </template>

                            <!-- rate 评分 -->
                            <template v-else-if="item.component === 'rate'">
                                <a-rate v-model="getModelRef(item).value" :count="item.options?.count"
                                    :allow-half="item.options?.allowHalf" :disabled="item.options?.disabled" />
                            </template>

                            <!-- slider 滑块 -->
                            <template v-else-if="item.component === 'slider'">
                                <a-slider v-model="getModelRef(item).value" :min="item.options?.min"
                                    :max="item.options?.max" :step="item.options?.step"
                                    :disabled="item.options?.disabled" />
                            </template>

                            <!-- tags 标签输入 -->
                            <template v-else-if="item.component === 'tags'">
                                <div class="pro-form-tags">
                                    <a-tag v-for="(tag, idx) in (getModelRef(item).value || [])" :key="idx" closable
                                        @close="removeTag(item, (idx as number))">
                                        {{ tag }}
                                    </a-tag>
                                    <a-input v-model="tagInputMap[getPropName(item)]" size="mini" style="width: 80px;"
                                        placeholder="添加" @keyup.enter="addTag(item)" @blur="addTag(item)" allow-clear />
                                </div>
                            </template>

                            <!-- upload 文件上传（通过 SingleUpload 封装，支持 apiObj / ossConfig / 进度覆盖层 / 预览删除） -->
                            <template v-else-if="item.component === 'upload'">
                                <SingleUpload v-model="getModelRef(item).value" v-bind="item.options || {}" />
                            </template>

                            <!-- 兜底：任何未识别 component 字符串 => 渲染具名插槽 -->
                            <template v-else>
                                <slot :name="item.component" :item="item" :model="formData"
                                    :modelRef="getModelRef(item)" />
                            </template>

                            <!-- 组件下方的额外说明文字 -->
                        </a-form-item>
                        <div v-if="item.message" class="pro-form-message">{{ item.message }}</div>
                    </a-col>

                </template>
            </a-row>

            <!-- 行动区插槽，用于放置提交/重置按钮 -->
            <div class="pro-form-actions">
                <slot name="action" :form="formRef" :model="formData" />
            </div>
        </a-form>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, reactive, onMounted } from 'vue';
import type { FormItemConfig, ProFormProps } from './types';
import { SingleUpload } from '../ProUpload';

// ==========================================
// 1. Props & Emits
// ==========================================
const props = defineProps<ProFormProps>();
const emit = defineEmits(['update:modelValue', 'submit']);

// 底层 a-form 实例句柄
const formRef = ref();

// 组件内部维护的表单数据镜像
const formData = reactive<Record<string, any>>({});

// tags 组件的临时输入缓冲（以 propName 为 key 独立存储）
const tagInputMap = reactive<Record<string, string>>({});

// ==========================================
// 2. 深度合并初始化
// ==========================================

/**
 * 简易深度合并工具：将 src 合并到 dst，遇到对象类型则递归
 */
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

/**
 * 遍历 items，确保嵌套对象已经在 formData 上完成初始化
 */
function initFormData() {
    // 先把外部 modelValue 深度合并进来
    deepMerge(formData, props.modelValue || {});

    // 再处理每个 item 的嵌套对象键，确保 formData[item.name] 存在
    props.items.forEach(item => {
        if (item.name && item.options?.name) {
            if (!formData[item.name]) formData[item.name] = {};
        }
    });
}

onMounted(initFormData);

// 监听外部 modelValue 的变化并同步进来
watch(() => props.modelValue, (newVal) => {
    deepMerge(formData, newVal || {});
}, { deep: true });

// 将内部数据变化传递给外部 v-model
watch(formData, (newVal) => {
    emit('update:modelValue', { ...newVal });
}, { deep: true });

// ==========================================
// 3. 核心工具函数
// ==========================================

/**
 * 获取 a-form-item 的 field prop（即校验时的字段标识路径）
 * - 如果有 options.name 嵌套：返回 "parentName.childName"
 * - 否则：返回 "name"
 */
function getPropName(item: FormItemConfig): string {
    if (item.options?.name) return `${item.name}.${item.options.name}`;
    return item.name;
}

/**
 * 获取对该表单项数据的 { value } 引用代理
 * 利用 computed-like 对象形式使 v-model 能正确绑定到嵌套属性
 *
 * 核心思路：返回一个拥有 get/set value 属性的对象
 * - 嵌套：formData[item.name][item.options.name]
 * - 普通：formData[item.name]
 */
function getModelRef(item: FormItemConfig) {
    const parent = item.name;
    const child = item.options?.name;

    if (child) {
        // 确保父对象存在
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

// ==========================================
// 4. 动态显隐引擎
// ==========================================

/**
 * 动态判断是否**隐藏**当前项：
 * - boolean: 直接使用
 * - string:  通过 new Function 动态执行，$ 替换为 form 变量名以引用 formData
 */
function checkHide(item: FormItemConfig): boolean {
    const handle = item.hideHandle;
    if (handle === undefined || handle === null) return false;
    if (typeof handle === 'boolean') return handle;
    // 字符串形态：将 $ 替换为 form 变量，封装成函数动态求值
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

/**
 * 动态计算当前项的校验规则：
 * 如果配置了 requiredHandle（字符串表达式），动态计算并修改 rules 中的 required 属性
 */
function getRules(item: FormItemConfig) {
    const rules = item.rules ? [...item.rules] : [];
    if (item.requiredHandle) {
        try {
            const fn = new Function('form', `return (${item.requiredHandle.replace(/\$/g, 'form')})`);
            const isRequired = !!fn(formData);
            // 在现有规则中注入或修改 required 字段
            const requiredRule = rules.find(r => 'required' in r);
            if (requiredRule) {
                (requiredRule as any).required = isRequired;
            } else if (isRequired) {
                rules.unshift({ required: true, message: `${item.label}不能为空` });
            }
        } catch (e) {
            console.warn('[ProForm] requiredHandle 解析失败:', item.requiredHandle, e);
        }
    }
    return rules;
}

// ==========================================
// 6. tags 相关操作
// ==========================================

function addTag(item: FormItemConfig) {
    const key = getPropName(item);
    const val = (tagInputMap[key] || '').trim();
    if (!val) return;
    const ref = getModelRef(item);
    if (!Array.isArray(ref.value)) ref.value = [];
    if (!ref.value.includes(val)) {
        ref.value = [...ref.value, val];
    }
    tagInputMap[key] = '';
}

function removeTag(item: FormItemConfig, idx: number) {
    const ref = getModelRef(item);
    if (Array.isArray(ref.value)) {
        ref.value = ref.value.filter((_: any, i: number) => i !== idx);
    }
}

// ==========================================
// 7. 表单提交
// ==========================================

const handleSubmit = (data: any) => {
    emit('submit', data);
};

// ==========================================
// 8. 对外暴漏底层 API（供父组件通过 ref 调用）
// ==========================================
defineExpose({
    formRef,
    validate: () => formRef.value?.validate(),
    clearValidate: (fields?: string | string[]) => formRef.value?.clearValidate(fields),
    resetFields: (fields?: string | string[]) => formRef.value?.resetFields(fields),
    scrollToField: (field: string) => formRef.value?.scrollToField(field),
});
</script>

<style scoped>
.rong-pro-form {
    width: 100%;
}

/* 分组隔离标题带 */
.pro-form-divider {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px 0 8px;
}

.pro-form-divider__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-1);
    white-space: nowrap;
}

.pro-form-divider__icon {
    color: var(--color-text-3);
    cursor: pointer;
    flex-shrink: 0;
}

/* 标签旁的提示 icon */
.pro-form-label-icon {
    margin-left: 4px;
    color: var(--color-text-3);
    cursor: pointer;
    vertical-align: middle;
}

/* 组件下方说明文字 */
.pro-form-message {
    font-size: 12px;
    color: var(--color-text-3);
    margin-top: -8px;
    margin-bottom: 8px;
    padding-left: 2px;
    line-height: 1.6;
}

/* tags 输入展示区 */
.pro-form-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    padding: 2px 0;
}

/* 行动按钮区域 */
.pro-form-actions {
    margin-top: 16px;
    display: flex;
    justify-content: flex-start;
}
</style>
