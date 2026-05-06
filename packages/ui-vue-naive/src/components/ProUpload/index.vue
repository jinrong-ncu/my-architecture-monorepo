<template>
    <div class="pro-upload" :class="{ 'is-avatar': listType === 'avatar' }">
        <n-upload
            v-model:file-list="fileList"
            :list-type="naiveListType"
            :accept="accept"
            :max="computedLimit"
            :disabled="disabled"
            :custom-request="handleCustomRequest"
            :directory-dnd="directoryDnd"
            @remove="handleRemove"
            :class="{ 'hide-trigger': listType === 'avatar' && fileList.length > 0 }"
        >
            <!-- avatar / picture-card 模式 -->
            <template v-if="listType === 'avatar' || listType === 'picture-card'">
                {{ title || '点击上传' }}
            </template>
            
            <!-- drag 模式 -->
            <n-upload-dragger v-else-if="listType === 'drag'">
                <div style="margin-bottom: 12px">
                    <n-icon size="48" :depth="3">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path>
                        </svg>
                    </n-icon>
                </div>
                <n-text style="font-size: 16px">
                    {{ title || '点击或者拖动文件到该区域来上传' }}
                </n-text>
                <n-p depth="3" style="margin: 8px 0 0 0" v-if="hint">
                    {{ hint }}
                </n-p>
            </n-upload-dragger>

            <!-- 默认 button 模式 (text / picture-list) -->
            <template v-else>
                <n-button>{{ title || '上传文件' }}</n-button>
                <div v-if="hint" class="upload-hint">{{ hint }}</div>
            </template>
        </n-upload>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { NUpload, NUploadDragger, NButton, NIcon, NText, NP, useMessage } from 'naive-ui';
import type { UploadCustomRequestOptions, UploadFileInfo } from 'naive-ui';

// ==========================================
// 1. Props & Emits
// ==========================================
interface Props {
    modelValue?: any;
    listType?: 'avatar' | 'picture-card' | 'picture-list' | 'text' | 'drag';
    accept?: string;
    limit?: number;
    disabled?: boolean;
    title?: string;
    directoryDnd?: boolean;
    hint?: string;
    // 自定义本地/OSS上传函数
    apiObj?: (file: File, onProgress: (p: number) => void) => Promise<any>;
}

const props = withDefaults(defineProps<Props>(), {
    listType: 'text',
    limit: 0,
    disabled: false
});

const emit = defineEmits<{
    'update:modelValue': [val: any];
}>();

const message = useMessage();
const fileList = ref<UploadFileInfo[]>([]);

// ==========================================
// 2. Computed Props for Naive UI
// ==========================================
const computedLimit = computed(() => {
    if (props.listType === 'avatar') return 1;
    return props.limit || undefined; // limit=0 means unlimited in naive ui if passed as undefined
});

const naiveListType = computed(() => {
    if (props.listType === 'avatar' || props.listType === 'picture-card') return 'image-card';
    if (props.listType === 'picture-list') return 'image';
    return 'text';
});

// ==========================================
// 3. 数据回填同步 (v-model -> fileList)
// ==========================================
watch(
    () => props.modelValue,
    (newVal) => {
        if (!newVal) {
            fileList.value = [];
            return;
        }
        
        const arr = Array.isArray(newVal) ? newVal : [newVal];
        
        fileList.value = arr.map((item, index) => {
            if (typeof item === 'string') {
                return {
                    id: `preset-${index}`,
                    name: item.split('/').pop() || `file-${index}`,
                    status: 'finished',
                    url: item,
                    rawItem: item
                };
            }
            if (item && typeof item === 'object') {
                return {
                    id: item.uid || `preset-${index}`,
                    name: item.name || item.fileName || '未命名文件',
                    status: 'finished',
                    url: item.url || item.path || '',
                    rawItem: item
                };
            }
            return { id: `preset-${index}`, name: '未知文件', status: 'finished' } as any;
        });
    },
    { immediate: true, deep: true }
);

// ==========================================
// 4. 上传与删除同步 (fileList -> v-model)
// ==========================================
function syncModelValue() {
    const validFiles = fileList.value.filter(f => f.status === 'finished');
    const results = validFiles.map(f => (f as any).rawItem || f.url);
    
    if (props.listType === 'avatar' || props.limit === 1) {
        emit('update:modelValue', results[0] || null);
    } else {
        emit('update:modelValue', results);
    }
}

function handleRemove(options: { file: UploadFileInfo; fileList: UploadFileInfo[] }) {
    fileList.value = options.fileList;
    syncModelValue();
    return true;
}

// ==========================================
// 5. 自定义上传行为
// ==========================================
async function handleCustomRequest(options: UploadCustomRequestOptions) {
    const { file, onProgress, onFinish, onError } = options;
    
    if (!file.file) {
        onError();
        return;
    }

    try {
        let resultUrl = '';
        let rawItem: any = null;

        if (props.apiObj) {
            // 使用外部传入的自定义上传 API
            const response = await props.apiObj(file.file, (percent) => {
                onProgress({ percent });
            });
            resultUrl = typeof response === 'string' ? response : (response?.url || '');
            rawItem = response;
        } else {
            // 默认兜底逻辑：读取成本地 base64/blob 模拟上传成功
            message.info('未配置上传接口，已使用本地 Blob 模拟');
            await new Promise((resolve) => setTimeout(resolve, 800)); // 模拟延迟
            resultUrl = URL.createObjectURL(file.file);
            rawItem = { name: file.file.name, url: resultUrl };
            onProgress({ percent: 100 });
        }

        file.url = resultUrl;
        (file as any).rawItem = rawItem;
        
        onFinish();
        syncModelValue();

    } catch (err) {
        message.error('上传失败');
        onError();
    }
}
</script>

<style scoped>
.pro-upload {
    width: 100%;
}

/* 头像模式样式：隐藏上传按钮（如果有图片的话），并变成圆形 */
.pro-upload.is-avatar :deep(.n-upload-trigger.n-upload-trigger--image-card) {
    border-radius: 50%;
}
.pro-upload.is-avatar :deep(.n-upload-file-list .n-upload-file.n-upload-file--image-card-type) {
    border-radius: 50%;
}

.pro-upload .hide-trigger :deep(.n-upload-trigger) {
    display: none;
}

.upload-hint {
    font-size: 12px;
    color: var(--n-text-color-3);
    margin-top: 4px;
}
</style>
