<template>
    <div class="rongshiyi-pro-form">
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

                            <!-- 只读模式：统一走同源 schema 的文本渲染引擎，不使用 disabled 灰态控件 -->
                            <template v-if="props.readonly">
                                <!-- upload 详情态：结构化展示（缩略图/文件名），避免只显示一串文本 -->
                                <template v-if="item.component === 'upload'">
                                    <div v-if="getReadonlyUploadFiles(getModelRef(item).value).length" class="pro-form-readonly-upload">
                                        <div v-for="(file, idx) in getReadonlyUploadFiles(getModelRef(item).value)"
                                            :key="file.url || file.name || idx" class="pro-form-readonly-upload__item">
                                            <a-image v-if="file.isImage && file.url" :src="file.url" :width="56" :height="56"
                                                fit="cover" style="border-radius: 4px; flex-shrink: 0;" />
                                            <icon-file v-else class="pro-form-readonly-upload__icon" />
                                            <a-link v-if="file.url" :href="file.url" target="_blank" class="pro-form-readonly-upload__name">
                                                {{ file.name }}
                                            </a-link>
                                            <span v-else class="pro-form-readonly-upload__name">{{ file.name }}</span>
                                        </div>
                                    </div>
                                    <div v-else class="pro-form-readonly-text">-</div>
                                </template>
                                <div v-else class="pro-form-readonly-text">{{ renderReadonlyText(item, getModelRef(item).value) }}</div>
                            </template>

                            <!-- ======= 内部组件智能分发 ======= -->

                            <!-- input 单行文本框 -->
                            <template v-else-if="item.component === 'input'">
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

                            <!-- upload 文件上传（通过 ProUpload 封装，支持 avatar/picture-card/picture-list/text 四种模式） -->
                            <template v-else-if="item.component === 'upload'">
                                <ProUpload v-model="getModelRef(item).value"
                                    :list-type="item.options?.listType || 'text'" v-bind="item.options || {}" />
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
            <div v-if="!props.readonly" class="pro-form-actions">
                <slot name="action" :form="formRef" :model="formData" />
            </div>
        </a-form>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, reactive, onMounted } from 'vue';
import type { FormItemConfig, ProFormProps } from './types';
import { ProUpload } from '../ProUpload';

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

/**
 * 判断值是否为空。
 * - undefined / null / 空字符串 / 空数组 都视为“空”
 */
function isEmptyValue(value: unknown): boolean {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
}

/**
 * 宽松比较 value：优先严格相等，兜底走字符串比较。
 * 解决后端返回 number、前端 options 用 string 的常见不一致问题。
 */
function isSameValue(left: unknown, right: unknown): boolean {
    return left === right || String(left) === String(right);
}

/**
 * 在 options 中查找 value 对应的 label。
 * 仅命中同层级数据，返回 undefined 代表未匹配。
 */
function findLabelByValue(
    options: Array<{ label: string; value: any }> = [],
    targetValue: unknown,
): string | undefined {
    const matched = options.find(option => isSameValue(option.value, targetValue));
    return matched?.label;
}

/**
 * 将任意值渲染为可读文本（兜底策略）。
 * - Date 对象：转 ISO 字符串
 * - 数组：以“、”连接
 * - 其它：String(value)
 */
function toDisplayText(value: unknown): string {
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.join('、');
    return String(value);
}

/**
 * 将日期值转换为文本。
 *
 * 兼容场景：
 * - 原生 Date
 * - Dayjs（Arco DatePicker 常见返回对象，具备 format 方法）
 * - 字符串/数字时间戳
 */
function formatDateText(value: unknown, format?: string): string {
    const targetFormat = format || 'YYYY-MM-DD';

    // Dayjs-like: 通过鸭子类型识别，避免额外引入依赖。
    if (value && typeof value === 'object' && 'format' in (value as Record<string, any>)) {
        const dayjsLike = value as { format: (fmt?: string) => string };
        const text = dayjsLike.format?.(targetFormat);
        return text?.trim() ? text : '-';
    }

    if (value instanceof Date) {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        const hour = String(value.getHours()).padStart(2, '0');
        const minute = String(value.getMinutes()).padStart(2, '0');
        const second = String(value.getSeconds()).padStart(2, '0');

        // 未引入日期库时，做一个最小可用的 format 替换。
        return targetFormat
            .replace(/YYYY/g, String(year))
            .replace(/MM/g, month)
            .replace(/DD/g, day)
            .replace(/HH/g, hour)
            .replace(/mm/g, minute)
            .replace(/ss/g, second);
    }

    return toDisplayText(value);
}

/**
 * 根据 cascader 的 value 路径，解析对应的 label 路径。
 * 例如 value: ["zj", "hz"] => "浙江 / 杭州"
 */
function getCascaderPathLabel(
    options: Array<{ label: string; value: any; children?: any[] }> = [],
    pathValues: unknown,
): string {
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

/**
 * 从 URL/path 中提取文件名。
 * 若无法提取，返回原始文本。
 */
function extractFileNameFromPath(path: string): string {
    const trimmed = path.trim();
    if (!trimmed) return '';

    // 去掉 query / hash 后再取最后一段
    const cleanPath = trimmed.split('?')[0].split('#')[0];
    const name = cleanPath.split('/').pop() || cleanPath;

    try {
        return decodeURIComponent(name);
    } catch {
        return name;
    }
}

/**
 * 从 upload 单个条目提取可读名称。
 *
 * 兼容常见数据：
 * - string: 直接视为 URL 或文件路径
 * - object: 优先 name/fileName/filename/title，再回退 url/path
 */
function getUploadItemText(fileItem: unknown): string {
    if (typeof fileItem === 'string') {
        return extractFileNameFromPath(fileItem) || '-';
    }

    if (!fileItem || typeof fileItem !== 'object') return '-';

    const data = fileItem as Record<string, any>;
    const directName = data.name || data.fileName || data.filename || data.title;
    if (typeof directName === 'string' && directName.trim()) return directName.trim();

    const pathLike = data.url || data.path || data.fileUrl || data.file_path;
    if (typeof pathLike === 'string' && pathLike.trim()) {
        return extractFileNameFromPath(pathLike) || '-';
    }

    return '-';
}

/**
 * 只读上传展示项。
 */
interface ReadonlyUploadFile {
    name: string;
    url?: string;
    isImage: boolean;
}

/**
 * 判断 url/path 是否为图片资源。
 */
function isImagePath(path?: string): boolean {
    if (!path) return false;
    return /\.(png|jpg|jpeg|gif|webp|svg|bmp)(\?.*)?$/i.test(path);
}

/**
 * 将 upload 的任意值归一化为可读展示数组。
 * 支持 string / object / array 三种输入。
 */
function getReadonlyUploadFiles(rawValue: unknown): ReadonlyUploadFile[] {
    if (isEmptyValue(rawValue)) return [];

    const list = Array.isArray(rawValue) ? rawValue : [rawValue];

    return list
        .map((fileItem): ReadonlyUploadFile | null => {
            if (typeof fileItem === 'string') {
                const url = fileItem.trim();
                if (!url) return null;
                return {
                    name: extractFileNameFromPath(url) || '未命名文件',
                    url,
                    isImage: isImagePath(url),
                };
            }

            if (!fileItem || typeof fileItem !== 'object') return null;

            const data = fileItem as Record<string, any>;
            const url = (data.url || data.path || data.fileUrl || data.file_path || '').toString().trim() || undefined;
            const name = (typeof data.name === 'string' && data.name.trim())
                || (typeof data.fileName === 'string' && data.fileName.trim())
                || (typeof data.filename === 'string' && data.filename.trim())
                || (typeof data.title === 'string' && data.title.trim())
                || (url ? extractFileNameFromPath(url) : '')
                || '未命名文件';

            return {
                name,
                url,
                isImage: isImagePath(url),
            };
        })
        .filter((item): item is ReadonlyUploadFile => !!item);
}

/**
 * 只读模式文本渲染引擎。
 *
 * 目标：复用 ProForm Schema 的同源配置能力，避免详情页重复写字典翻译逻辑。
 * 规则：
 * 1) 输入类（input/textarea/number/date/tags 等）=> 直接转纯文本
 * 2) 选择类（select/radio/checkboxGroup）=> 用 options.items 做 value -> label 翻译
 * 3) 空值、未匹配值 => 返回 "-"
 */
function renderReadonlyText(item: FormItemConfig, rawValue: unknown): string {
    // 统一空态兜底，保证详情页视觉稳定。
    if (isEmptyValue(rawValue)) return '-';

    const component = item.component;
    const options = item.options?.items || [];

    // 选择类：优先做字典翻译。
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

    // cascader：将路径 value 翻译成“父 / 子 / 孙”文本。
    if (component === 'cascader') {
        if (!Array.isArray(rawValue)) return '-';

        // multiple 模式下，常见值为二维数组：[[a,b], [c,d]]
        if (rawValue.length > 0 && Array.isArray(rawValue[0])) {
            const pathTexts = (rawValue as unknown[])
                .map(path => getCascaderPathLabel(options, path))
                .filter(text => text !== '-');
            return pathTexts.length ? pathTexts.join('；') : '-';
        }

        // 单选模式：值是一维路径数组 [a,b,c]
        return getCascaderPathLabel(options, rawValue);
    }

    // date：优先按 schema.format 输出，未配置时默认 YYYY-MM-DD。
    if (component === 'date') {
        if (Array.isArray(rawValue)) {
            const list = rawValue
                .map(value => formatDateText(value, item.options?.format))
                .filter(text => text !== '-');
            return list.length ? list.join(' ~ ') : '-';
        }
        return formatDateText(rawValue, item.options?.format);
    }

    // upload：统一提取“文件可读名称”，支持 string / object / array。
    if (component === 'upload') {
        if (Array.isArray(rawValue)) {
            const names = rawValue
                .map(fileItem => getUploadItemText(fileItem))
                .filter(name => name !== '-');
            return names.length ? names.join('、') : '-';
        }

        return getUploadItemText(rawValue);
    }

    // 单个 checkbox 常见值为 boolean，做更友好的中文展示。
    if (component === 'checkbox') {
        return rawValue ? '是' : '否';
    }

    // 开关组件在详情态中同样建议输出中文语义。
    if (component === 'switch') {
        return rawValue ? '开启' : '关闭';
    }

    // 其余输入类组件统一走文本兜底。
    const text = toDisplayText(rawValue);
    return text.trim() ? text : '-';
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
.rongshiyi-pro-form {
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

/* 只读模式文本：避免 disabled 灰态带来的低可读性 */
.pro-form-readonly-text {
    min-height: 32px;
    line-height: 32px;
    color: var(--color-text-1);
    white-space: pre-wrap;
    word-break: break-word;
}

/* 只读上传列表：图片缩略图 + 文件名，增强详情可读性 */
.pro-form-readonly-upload {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 4px 0;
}

.pro-form-readonly-upload__item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.pro-form-readonly-upload__icon {
    font-size: 22px;
    color: var(--color-text-3);
    flex-shrink: 0;
}

.pro-form-readonly-upload__name {
    color: var(--color-text-1);
    word-break: break-all;
}
</style>
