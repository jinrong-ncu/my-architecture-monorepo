<template>
    <div class="pro-upload" :class="[`mode-${listType}`, { 'is-disabled': disabled }]">

        <!-- ==================== 模式一：avatar 头像单传 ==================== -->
        <template v-if="listType === 'avatar'">
            <SingleUpload :model-value="(singleValue as string | undefined)" @update:model-value="onSingleUpdate"
                :accept="accept" :max-size="maxSize" :title="title || '点击上传1'" :hint="hint" :disabled="disabled"
                :api-obj="apiObj" :oss-config="ossConfig" :parse-data="parseData" />
        </template>

        <!-- ==================== 模式二：picture-card 照片墙 ==================== -->
        <template v-else-if="listType === 'picture-card'">
            <div class="picture-card-wall">
                <!-- 已上传的图片卡片列表 -->
                <div v-for="(item, idx) in fileCards" :key="item.uid" class="picture-card-item"
                    @mouseenter="item.hover = true" @mouseleave="item.hover = false">
                    <!-- 上传中：圆形进度 -->
                    <div v-if="item.status === 'uploading'" class="card-uploading">
                        <a-progress type="circle" :percent="item.percent / 100" :width="52" />
                    </div>
                    <!-- 完成：图片预览 -->
                    <template v-else-if="item.status === 'done'">
                        <a-image v-if="item.isImage" :src="item.url" fit="cover" width="100%" height="100%"
                            :preview="!item.hover" style="display: block; border-radius: 4px;" />
                        <div v-else class="card-file-placeholder">
                            <icon-file style="font-size: 26px; color: var(--color-primary-6)" />
                            <span class="card-filename">{{ item.name }}</span>
                        </div>
                    </template>
                    <!-- 失败 -->
                    <div v-else-if="item.status === 'error'" class="card-error">
                        <icon-close-circle style="font-size: 24px; color: var(--color-danger-6)" />
                    </div>

                    <!-- 操作蒙层（悬浮显示） -->
                    <div v-show="item.hover && item.status === 'done'" class="card-mask">
                        <a-space :size="8">
                            <a-link @click.stop="removeCard(item.uid)">
                                <icon-delete style="color: #fff; font-size: 16px;" />
                            </a-link>
                        </a-space>
                    </div>
                </div>

                <!-- 添加按钮（未超出上限时显示） -->
                <a-upload v-if="!maxCount || fileCards.length < maxCount" :accept="accept" :multiple="true"
                    :show-file-list="false" :disabled="disabled" :custom-request="handleCustomRequest"
                    class="picture-card-adder">
                    <div class="picture-card-add-btn">
                        <icon-plus />
                        <span>{{ title || '添加图片' }}</span>
                    </div>
                </a-upload>
            </div>
        </template>

        <!-- ==================== 模式三：text 文件列表 / picture-list 缩略列表 ==================== -->
        <template v-else>
            <!-- 上传触发区 -->
            <a-upload :accept="accept" :multiple="true" :show-file-list="false" :drag="drag"
                :disabled="disabled || (!!maxCount && fileCards.length >= maxCount)"
                :custom-request="handleCustomRequest">
                <div class="upload-trigger" :class="{ 'is-drag': drag }">
                    <icon-upload class="trigger-icon" />
                    <div class="trigger-text">
                        <span>{{ drag ? '点击或拖拽文件到此处' : (title || '点击选择文件') }}</span>
                        <span v-if="hint" class="trigger-hint">{{ hint }}</span>
                    </div>
                </div>
            </a-upload>

            <!-- 文件列表 -->
            <ul v-if="fileCards.length" class="file-list" :class="{ 'is-picture': listType === 'picture-list' }">
                <li v-for="item in fileCards" :key="item.uid" class="file-list-item"
                    :class="{ 'has-error': item.status === 'error' }">
                    <!-- 缩略图（picture-list 模式） -->
                    <div v-if="listType === 'picture-list'" class="file-thumb">
                        <a-image v-if="item.isImage && item.url" :src="item.url" :preview="false" width="40" height="40"
                            fit="cover" style="border-radius: 3px;" />
                        <component v-else :is="getFileIcon(item.name)"
                            style="font-size: 28px; color: var(--color-primary-6)" />
                    </div>

                    <!-- 文件名 + 进度 -->
                    <div class="file-info">
                        <span class="file-name" :class="{ 'name-error': item.status === 'error' }">{{ item.name
                            }}</span>
                        <a-progress v-if="item.status === 'uploading'" :percent="item.percent" :show-text="false"
                            size="small" style="margin-top: 4px;" />
                        <span v-else-if="item.status === 'error'" class="error-text">上传失败</span>
                        <span v-else class="success-text">上传成功</span>
                    </div>

                    <!-- 状态图标 + 删除 -->
                    <div class="file-actions">
                        <icon-check-circle v-if="item.status === 'done'" class="status-ok" />
                        <icon-close-circle v-else-if="item.status === 'error'" class="status-err" />
                        <a-spin v-else-if="item.status === 'uploading'" :size="14" />
                        <button class="delete-btn" @click="removeCard(item.uid)">
                            <icon-close />
                        </button>
                    </div>
                </li>
            </ul>
        </template>

    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Message } from '@arco-design/web-vue';
import type { RequestOption } from '@arco-design/web-vue';
import { useUploadQueue } from './hooks/useUploadQueue';
import { useOSS } from './hooks/useOSS';
import type { OSSConfig } from './hooks/useOSS';
import SingleUpload from './SingleUpload.vue';

// ==========================================
// 1. Props & Emits
// ==========================================
interface Props {
    /**
     * 展示模式：
     * - avatar      单文件头像（正方形预览框）
     * - picture-card 照片墙（网格 + 添加按钮）
     * - picture-list 图片列表（缩略图 + 文件名）
     * - text         纯文本文件列表
     */
    listType?: 'avatar' | 'picture-card' | 'picture-list' | 'text';

    /** v-model：avatar 模式为 string，其余模式为 any[] */
    modelValue?: string | any[];

    /** 允许的文件类型 */
    accept?: string;
    /** 单文件大小上限（MB） */
    maxSize?: number;
    /** 最大文件数量（仅 multi 模式有效） */
    maxCount?: number;
    /** 标题文字 */
    title?: string;
    /** 提示文字（可选） */
    hint?: string;
    /** 是否开启拖拽（仅 text/picture-list 模式） */
    drag?: boolean;
    /** 最大并发数（默认 3） */
    maxConcurrent?: number;
    /** 是否禁用 */
    disabled?: boolean;

    /** 自定义上传函数 */
    apiObj?: (file: File, onProgress: (p: number) => void) => Promise<any>;
    /** OSS 直传配置 */
    ossConfig?: OSSConfig;
    /** 从接口返回值提取最终存储的数据 */
    parseData?: (response: any) => any;
}

const props = withDefaults(defineProps<Props>(), {
    listType: 'text',
    maxConcurrent: 3,
    maxSize: 100,
    disabled: false,
    drag: false,
});
const emit = defineEmits<{
    'update:modelValue': [val: string | any[] | undefined];
}>();

// ==========================================
// 2. 内部文件卡片状态（multi 模式用）
// ==========================================
interface FileCard {
    uid: string;
    name: string;
    status: 'uploading' | 'done' | 'error';
    percent: number;
    url?: string;
    isImage: boolean;
    hover: boolean;
    rawResult?: any;
}
const fileCards = ref<FileCard[]>([]);

// ==========================================
// 3. avatar 模式：简单的 string 绑定
// ==========================================
const singleValue = computed(() =>
    typeof props.modelValue === 'string' ? props.modelValue : undefined
);
function onSingleUpdate(v: string | Record<string, any> | undefined) {
    emit('update:modelValue', v as string | undefined);
}

// ==========================================
// 4. 工具函数
// ==========================================
const IMAGE_EXTS = /\.(png|jpg|jpeg|gif|webp|svg|bmp)(\?.*)?$/i;
function isImageFile(name: string) { return IMAGE_EXTS.test(name); }

function getFileIcon(name: string): string {
    if (/\.pdf$/i.test(name)) return 'icon-file-pdf';
    if (/\.(xlsx|xls)$/i.test(name)) return 'icon-file-excel';
    if (/\.(docx|doc)$/i.test(name)) return 'icon-file-word';
    if (/\.(mp4|mov|avi)$/i.test(name)) return 'icon-video-camera';
    if (/\.(zip|rar|7z)$/i.test(name)) return 'icon-archive';
    return 'icon-file';
}

function validateFile(file: File): boolean {
    if (props.maxSize && file.size > props.maxSize * 1024 * 1024) {
        Message.warning(`${file.name} 超过最大限制 ${props.maxSize}MB`);
        return false;
    }
    if (props.accept) {
        const types = props.accept.split(',').map(s => s.trim());
        const ok = types.some(t => {
            if (t.startsWith('.')) return file.name.toLowerCase().endsWith(t.toLowerCase());
            if (t.endsWith('/*')) return file.type.startsWith(t.replace('/*', '/'));
            return file.type === t;
        });
        if (!ok) { Message.warning(`${file.name} 文件格式不符合要求`); return false; }
    }
    return true;
}

// ==========================================
// 5. 并发队列
// ==========================================
const { addTask } = useUploadQueue(props.maxConcurrent);

// ==========================================
// 6. 自定义上传拦截（multi 模式）
// ==========================================
function handleCustomRequest(option: RequestOption) {
    const { fileItem } = option;
    const file = fileItem.file!;
    if (!validateFile(file)) return;

    const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const card: FileCard = {
        uid, name: file.name, status: 'uploading', percent: 0,
        isImage: isImageFile(file.name), hover: false
    };
    fileCards.value.push(card);

    addTask(async () => {
        try {
            let response: any;
            if (props.ossConfig) {
                await new Promise<void>((resolve, reject) => {
                    const { customRequest } = useOSS(props.ossConfig!);
                    customRequest({
                        ...option,
                        onProgress: (p: number) => { card.percent = p; },
                        onSuccess: (res: any) => { response = res; resolve(); },
                        onError: (err: Error) => reject(err)
                    });
                });
            } else if (props.apiObj) {
                response = await props.apiObj(file, p => { card.percent = p; });
            } else {
                throw new Error('[ProUpload] 未配置 apiObj 或 ossConfig');
            }

            const result = props.parseData ? props.parseData(response)
                : (response?.url || response);
            card.url = typeof result === 'string' ? result : undefined;
            card.percent = 100;
            card.status = 'done';
            card.rawResult = result;
            syncModelValue();
        } catch {
            card.status = 'error';
        }
    });
}

function removeCard(uid: string) {
    fileCards.value = fileCards.value.filter(c => c.uid !== uid);
    syncModelValue();
}

function syncModelValue() {
    const results = fileCards.value.filter(c => c.status === 'done').map(c => c.rawResult);
    emit('update:modelValue', results);
}
</script>

<style scoped>
.pro-upload {
    width: 100%;
}

.is-disabled {
    cursor: not-allowed;
    opacity: 0.6;
    pointer-events: none;
}

/* ============ picture-card 照片墙 ============ */
.picture-card-wall {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.picture-card-item {
    width: 104px;
    height: 104px;
    border: 1px solid var(--color-border-2);
    border-radius: 6px;
    overflow: hidden;
    position: relative;
    background: var(--color-fill-2);
    flex-shrink: 0;
}

.card-uploading,
.card-error {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.card-file-placeholder {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 6px;
}

.card-filename {
    font-size: 10px;
    color: var(--color-text-2);
    word-break: break-all;
    text-align: center;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.card-mask {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
}

/* 添加按钮格 */
.picture-card-adder :deep(.arco-upload) {
    display: block;
}

.picture-card-add-btn {
    width: 104px;
    height: 104px;
    border: 1px dashed var(--color-border-2);
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    color: var(--color-text-3);
    font-size: 13px;
    background: var(--color-fill-1);
    transition: border-color .2s, color .2s;
}

.picture-card-add-btn:hover {
    border-color: rgb(var(--primary-6));
    color: rgb(var(--primary-6));
}

.picture-card-add-btn .arco-icon {
    font-size: 22px;
}

/* ============ 上传触发区（text / picture-list 模式） ============ */
.upload-trigger {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    border: 1px dashed var(--color-border-2);
    border-radius: 6px;
    background: var(--color-fill-1);
    cursor: pointer;
    transition: border-color .2s, background .2s;
}

.upload-trigger:hover {
    border-color: rgb(var(--primary-6));
    background: var(--color-primary-light-1);
}

.upload-trigger.is-drag {
    flex-direction: column;
    padding: 32px 20px;
    justify-content: center;
    text-align: center;
}

.trigger-icon {
    font-size: 22px;
    color: var(--color-text-3);
}

.trigger-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 13px;
    color: var(--color-text-2);
}

.trigger-hint {
    font-size: 11px;
    color: var(--color-text-4);
}

/* ============ 文件列表（text / picture-list 模式） ============ */
.file-list {
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.file-list-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border: 1px solid var(--color-border-2);
    border-radius: 6px;
    background: var(--color-fill-1);
    transition: background .15s;
}

.file-list-item:hover {
    background: var(--color-fill-2);
}

.file-list-item.has-error {
    border-color: rgb(var(--danger-3));
    background: var(--color-danger-light-1);
}

/* 缩略图 */
.file-thumb {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* 文件信息 */
.file-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.file-name {
    font-size: 13px;
    color: var(--color-text-1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.name-error {
    color: rgb(var(--danger-6));
}

.success-text {
    font-size: 11px;
    color: var(--color-success-6);
}

.error-text {
    font-size: 11px;
    color: rgb(var(--danger-6));
}

/* 操作区 */
.file-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
}

.status-ok {
    color: var(--color-success-6);
    font-size: 16px;
}

.status-err {
    color: rgb(var(--danger-6));
    font-size: 16px;
}

.delete-btn {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: none;
    background: var(--color-fill-3);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-3);
    font-size: 10px;
    padding: 0;
    transition: background .15s;
}

.delete-btn:hover {
    background: rgb(var(--danger-6));
    color: #fff;
}
</style>
