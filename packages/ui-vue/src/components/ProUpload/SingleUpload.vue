<template>
    <div class="pro-single-upload" :class="{ 'is-disabled': disabled }">
        <a-upload :accept="accept" :limit="1" :show-file-list="false" :custom-request="handleCustomRequest"
            :disabled="disabled || !!innerValue">
            <!-- 无文件时显示上传占位区 -->
            <div v-if="!innerValue" class="upload-placeholder">
                <component :is="icon || 'icon-upload'" class="placeholder-icon" />
                <span class="placeholder-title">{{ title || '点击上传' }}</span>
                <span class="placeholder-hint">{{ hint }}</span>
            </div>

            <!-- 有文件时渲染预览（禁用上传按钮，改走删除逻辑） -->
            <div v-else class="upload-preview" @mouseenter="showDeleteMask = true" @mouseleave="showDeleteMask = false">
                <!-- 图片预览 -->
                <a-image v-if="isImage" :src="innerValue" :alt="title" fit="cover" width="100%" height="100%"
                    :preview="false" style="border-radius: 4px;" />
                <!-- 视频预览 -->
                <video v-else-if="isVideo" :src="innerValue"
                    style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" controls />
                <!-- 通用文件（显示文件图标和名称） -->
                <div v-else class="file-thumb">
                    <icon-file style="font-size: 32px; color: var(--color-primary-6);" />
                    <span class="file-thumb-name">{{ fileName }}</span>
                </div>

                <!-- 悬浮删除蒙层 -->
                <div v-show="showDeleteMask" class="delete-mask" @click.stop="handleDelete">
                    <icon-delete style="font-size: 22px; color: #fff;" />
                </div>
            </div>
        </a-upload>

        <!-- 上传进度遮罩层 -->
        <div v-if="uploading" class="uploading-overlay">
            <a-progress type="circle" :percent="uploadPercent" :width="80" status="normal" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Message } from '@arco-design/web-vue';
import type { RequestOption } from '@arco-design/web-vue';
import { useOSS } from './hooks/useOSS';
import type { OSSConfig } from './hooks/useOSS';

// ==========================================
// 1. Props 定义
// ==========================================
interface Props {
    /** v-model 绑定的文件 URL 或对象 */
    modelValue?: string | Record<string, any>;
    /** 允许上传的文件类型，如 image/* */
    accept?: string;
    /** 文件大小上限，单位 MB */
    maxSize?: number;
    /** 占位区域标题 */
    title?: string;
    /** 占位图标的组件名（如 'icon-camera'） */
    icon?: string;
    /** 占位区域下方提示文字 */
    hint?: string;
    /** 是否禁用 */
    disabled?: boolean;
    /** 云存储配置（与 apiObj 二选一） */
    ossConfig?: OSSConfig;
    /**
     * 自定义上传函数（与 ossConfig 二选一）
     * 传入文件，返回 {url, ...} 的 Promise
     */
    apiObj?: (file: File, onProgress: (p: number) => void) => Promise<any>;
    /**
     * 结果映射函数，从接口返回值中提取要存入 v-model 的字段
     * 不传则默认取 response.url
     */
    parseData?: (response: any) => string;
}

const props = withDefaults(defineProps<Props>(), {
    maxSize: 10,
    title: '点击上传',
    hint: '',
    disabled: false,
});

const emit = defineEmits<{
    'update:modelValue': [val: string | Record<string, any> | undefined];
}>();

// ==========================================
// 2. 内部状态
// ==========================================
const innerValue = ref<string | undefined>(
    typeof props.modelValue === 'string' ? props.modelValue : undefined
);
const uploading = ref(false);
const uploadPercent = ref(0);
const showDeleteMask = ref(false);

watch(() => props.modelValue, (v) => {
    innerValue.value = typeof v === 'string' ? v : undefined;
});

// ==========================================
// 3. 计算属性：文件类型判断
// ==========================================
const isImage = computed(() => {
    if (!innerValue.value) return false;
    return /\.(png|jpg|jpeg|gif|webp|svg|bmp)(\?.*)?$/i.test(innerValue.value);
});

const isVideo = computed(() => {
    if (!innerValue.value) return false;
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(innerValue.value);
});

const fileName = computed(() => {
    if (!innerValue.value) return '';
    return innerValue.value.split('/').pop() || innerValue.value;
});

// ==========================================
// 4. 校验函数（纯函数，可复用）
// ==========================================
function validateFile(file: File): boolean {
    if (props.maxSize && file.size > props.maxSize * 1024 * 1024) {
        Message.warning(`文件大小不能超过 ${props.maxSize}MB`);
        return false;
    }
    if (props.accept) {
        const acceptedTypes = props.accept.split(',').map(s => s.trim());
        const typeMatched = acceptedTypes.some(type => {
            if (type.startsWith('.')) return file.name.toLowerCase().endsWith(type.toLowerCase());
            if (type.endsWith('/*')) return file.type.startsWith(type.replace('/*', '/'));
            return file.type === type;
        });
        if (!typeMatched) {
            Message.warning(`文件格式不符合要求，仅支持：${props.accept}`);
            return false;
        }
    }
    return true;
}

// ==========================================
// 5. 自定义上传（接管 Arco 的请求发送）
// ==========================================
async function handleCustomRequest(requestOption: RequestOption) {
    const { fileItem, onProgress, onSuccess, onError } = requestOption;
    const file = fileItem.file!;

    if (!validateFile(file)) {
        onError(new Error('校验失败'));
        return;
    }

    uploading.value = true;
    uploadPercent.value = 0;

    const progressHandler = (percent: number) => {
        uploadPercent.value = percent;
        onProgress(percent);
    };

    try {
        let response: any;
        if (props.ossConfig) {
            // OSS 直传模式
            const { customRequest } = useOSS(props.ossConfig);
            await customRequest(requestOption);
            return; // OSS 内部自行调用 onSuccess/onError
        } else if (props.apiObj) {
            // 自定义 API 模式
            response = await props.apiObj(file, progressHandler);
        } else {
            throw new Error('[SingleUpload] 未配置 ossConfig 或 apiObj');
        }

        const url = props.parseData ? props.parseData(response) : (response?.url || response);
        innerValue.value = url;
        emit('update:modelValue', url);
        onSuccess(response);
    } catch (err) {
        Message.error('上传失败，请重试');
        onError(err as Error);
    } finally {
        uploading.value = false;
        uploadPercent.value = 0;
    }
}

// ==========================================
// 6. 删除文件
// ==========================================
function handleDelete() {
    innerValue.value = undefined;
    emit('update:modelValue', undefined);
    showDeleteMask.value = false;
}
</script>

<style scoped>
.pro-single-upload {
    position: relative;
    display: inline-block;
}

/* Arco Upload 内部样式覆盖 */
.pro-single-upload :deep(.arco-upload) {
    display: block;
}

.upload-placeholder,
.upload-preview {
    width: 120px;
    height: 120px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
    transition: border-color 0.2s;
}

.upload-placeholder {
    border: 1px dashed var(--color-border-2);
    background: var(--color-fill-1);
    gap: 8px;
}

.upload-placeholder:hover {
    border-color: rgb(var(--primary-6));
}

.upload-preview {
    border: 1px solid var(--color-border-2);
    background: var(--color-fill-2);
}

.placeholder-icon {
    font-size: 28px;
    color: var(--color-text-3);
}

.placeholder-title {
    font-size: 13px;
    color: var(--color-text-2);
}

.placeholder-hint {
    font-size: 11px;
    color: var(--color-text-4);
    text-align: center;
    padding: 0 8px;
}

/* 悬浮删除蒙层 */
.delete-mask {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 6px;
    transition: background 0.2s;
}

.delete-mask:hover {
    background: rgba(0, 0, 0, 0.65);
}

/* 文件缩略图 */
.file-thumb {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.file-thumb-name {
    font-size: 11px;
    color: var(--color-text-2);
    text-align: center;
    word-break: break-all;
    padding: 0 4px;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* 上传中进度遮罩 */
.uploading-overlay {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    z-index: 10;
}

/* 禁用态 */
.is-disabled .upload-placeholder,
.is-disabled .upload-preview {
    cursor: not-allowed;
    opacity: 0.6;
}
</style>
