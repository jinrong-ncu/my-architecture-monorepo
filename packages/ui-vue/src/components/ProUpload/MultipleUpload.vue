<template>
    <div class="pro-multiple-upload">
        <!-- ==================== 上传触发区域 ==================== -->
        <a-upload :accept="accept" :multiple="true" :show-file-list="false" :drag="drag"
            :disabled="fileSelect === false || disabled" :custom-request="handleCustomRequest">
            <div class="upload-trigger" :class="{ 'is-drag': drag }">
                <icon-upload class="trigger-icon" />
                <div class="trigger-text">
                    <span>{{ drag ? '点击或拖拽文件到此处上传' : '点击选择文件' }}</span>
                    <span v-if="maxSize" class="trigger-hint">单文件最大 {{ maxSize }}MB</span>
                </div>
            </div>
        </a-upload>

        <!-- ==================== 自定义文件卡片列表 ==================== -->
        <ul v-if="fileCards.length" class="file-grid">
            <li v-for="card in fileCards" :key="card.uid" class="file-card" @mouseenter="card.hover = true"
                @mouseleave="card.hover = false">
                <!-- 上传中：圆形进度 -->
                <div v-if="card.status === 'uploading'" class="card-uploading">
                    <a-progress type="circle" :percent="card.percent" :width="64" />
                    <span class="card-name">{{ card.name }}</span>
                </div>

                <!-- 成功 - 图片类型 -->
                <div v-else-if="card.status === 'done' && card.isImage" class="card-image">
                    <a-image :src="card.url" fit="cover" width="100%" height="100%" :preview="!card.hover"
                        style="display: block; border-radius: 6px;" />
                    <div class="card-name-bar">{{ card.name }}</div>
                    <!-- 悬浮删除按钮 -->
                    <button v-show="card.hover" class="card-delete-btn" @click="removeCard(card.uid)">
                        <icon-close />
                    </button>
                </div>

                <!-- 成功 - 非图片文件 -->
                <div v-else-if="card.status === 'done'" class="card-file">
                    <component :is="getFileIcon(card.name)" class="file-icon" />
                    <span class="card-name-center">{{ card.name }}</span>
                    <button v-show="card.hover" class="card-delete-btn" @click="removeCard(card.uid)">
                        <icon-close />
                    </button>
                </div>

                <!-- 失败状态 -->
                <div v-else-if="card.status === 'error'" class="card-error">
                    <icon-close-circle class="error-icon" />
                    <span class="card-name">{{ card.name }}</span>
                    <button class="card-delete-btn" @click="removeCard(card.uid)">
                        <icon-close />
                    </button>
                </div>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Message } from '@arco-design/web-vue';
import type { RequestOption } from '@arco-design/web-vue';
import { useUploadQueue } from './hooks/useUploadQueue';
import { useOSS } from './hooks/useOSS';
import type { OSSConfig } from './hooks/useOSS';

// ==========================================
// 1. Props 定义
// ==========================================
interface Props {
    /** v-model 绑定的文件结果数组 */
    modelValue?: Array<string | Record<string, any>>;
    /** 允许的文件类型 */
    accept?: string;
    /** 单文件大小上限，MB */
    maxSize?: number;
    /** 是否开启拖拽上传 */
    drag?: boolean;
    /** 最大并发上传数量（默认 3） */
    maxConcurrent?: number;
    /** false 时禁用文件选择 */
    fileSelect?: boolean;
    /** 是否全局禁用 */
    disabled?: boolean;
    /** 云存储配置 */
    ossConfig?: OSSConfig;
    /** 自定义 API 上传函数 */
    apiObj?: (file: File, onProgress: (p: number) => void) => Promise<any>;
    /** 从接口返回值中提取最终存入 v-model 数组的数据 */
    parseData?: (response: any) => string | Record<string, any>;
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: () => [],
    drag: false,
    maxConcurrent: 3,
    fileSelect: true,
    disabled: false,
    maxSize: 100,
});

const emit = defineEmits<{
    'update:modelValue': [val: Array<string | Record<string, any>>];
}>();

// ==========================================
// 2. 文件卡片状态模型
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

// 工具：判断是否为图片
const IMAGE_EXTS = /\.(png|jpg|jpeg|gif|webp|svg|bmp)(\?.*)?$/i;
function isImageFile(name: string) {
    return IMAGE_EXTS.test(name);
}

// 工具：根据文件名后缀返回对应 Arco 图标名
function getFileIcon(name: string): string {
    if (/\.pdf$/i.test(name)) return 'icon-file-pdf';
    if (/\.(xlsx|xls)$/i.test(name)) return 'icon-file-excel';
    if (/\.(docx|doc)$/i.test(name)) return 'icon-file-word';
    if (/\.(mp4|mov|avi)$/i.test(name)) return 'icon-video-camera';
    if (/\.(zip|rar|7z)$/i.test(name)) return 'icon-archive';
    return 'icon-file';
}

// ==========================================
// 3. 构建并发队列（每次组件实例化时创建）
// ==========================================
const { addTask } = useUploadQueue(props.maxConcurrent);

// ==========================================
// 4. 文件校验（纯函数）
// ==========================================
function validateFile(file: File): boolean {
    if (props.maxSize && file.size > props.maxSize * 1024 * 1024) {
        Message.warning(`${file.name} 超过最大限制 ${props.maxSize}MB`);
        return false;
    }
    if (props.accept) {
        const acceptedTypes = props.accept.split(',').map(s => s.trim());
        const ok = acceptedTypes.some(t => {
            if (t.startsWith('.')) return file.name.toLowerCase().endsWith(t.toLowerCase());
            if (t.endsWith('/*')) return file.type.startsWith(t.replace('/*', '/'));
            return file.type === t;
        });
        if (!ok) {
            Message.warning(`${file.name} 不符合文件格式要求`);
            return false;
        }
    }
    return true;
}

// ==========================================
// 5. 自定义上传拦截 — 将文件送入并发队列
// ==========================================
function handleCustomRequest(requestOption: RequestOption) {
    const { fileItem } = requestOption;
    const file = fileItem.file!;

    if (!validateFile(file)) return;

    // 创建卡片（立即加入列表，显示上传中占位）
    const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const card: FileCard = {
        uid,
        name: file.name,
        status: 'uploading',
        percent: 0,
        isImage: isImageFile(file.name),
        hover: false
    };
    fileCards.value.push(card);

    /**
     * 将真实上传逻辑封装成 taskFn 投入并发队列
     * 队列按 maxConcurrent 控制同时调用的上传数量
     */
    addTask(async () => {
        try {
            let response: any;
            if (props.ossConfig) {
                // OSS 直传：手动包装 onProgress 更新卡片进度
                await new Promise<void>((resolve, reject) => {
                    const { customRequest } = useOSS(props.ossConfig!);
                    customRequest({
                        ...requestOption,
                        onProgress: (percent: number) => {
                            card.percent = percent;
                        },
                        onSuccess: (res: any) => {
                            response = res;
                            resolve();
                        },
                        onError: (err: Error) => reject(err)
                    });
                });
            } else if (props.apiObj) {
                response = await props.apiObj(file, (p) => { card.percent = p; });
            } else {
                throw new Error('[MultipleUpload] 未配置 ossConfig 或 apiObj');
            }

            // 提取最终结果
            const result = props.parseData
                ? props.parseData(response)
                : (response?.url || response);

            card.url = typeof result === 'string' ? result : undefined;
            card.percent = 100;
            card.status = 'done';
            card.rawResult = result;
            syncToModelValue();
        } catch (err) {
            card.status = 'error';
            card.percent = 0;
            Message.error(`${file.name} 上传失败`);
        }
    });
}

// ==========================================
// 6. 删除卡片 & 同步给父组件
// ==========================================
function removeCard(uid: string) {
    fileCards.value = fileCards.value.filter(c => c.uid !== uid);
    syncToModelValue();
}

function syncToModelValue() {
    const results = fileCards.value
        .filter(c => c.status === 'done')
        .map(c => c.rawResult);
    emit('update:modelValue', results);
}
</script>

<style scoped>
.pro-multiple-upload {
    width: 100%;
}

/* 上传触发区域 */
.upload-trigger {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    border: 1px dashed var(--color-border-2);
    border-radius: 6px;
    background: var(--color-fill-1);
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
}

.upload-trigger:hover {
    border-color: rgb(var(--primary-6));
    background: var(--color-primary-light-1);
}

.upload-trigger.is-drag {
    flex-direction: column;
    padding: 40px 20px;
    text-align: center;
    justify-content: center;
}

.trigger-icon {
    font-size: 24px;
    color: var(--color-text-3);
}

.trigger-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 14px;
    color: var(--color-text-2);
}

.trigger-hint {
    font-size: 12px;
    color: var(--color-text-4);
}

/* 文件网格 */
.file-grid {
    list-style: none;
    margin: 12px 0 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

/* 单个文件卡片 */
.file-card {
    width: 110px;
    height: 110px;
    border-radius: 6px;
    border: 1px solid var(--color-border-2);
    overflow: hidden;
    position: relative;
    background: var(--color-fill-1);
    flex-shrink: 0;
}

/* 上传中：进度条居中 */
.card-uploading {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

/* 图片卡片 */
.card-image {
    position: relative;
    width: 100%;
    height: 100%;
}

.card-name-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    font-size: 11px;
    padding: 3px 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* 非图片文件卡片 */
.card-file {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px;
}

.file-icon {
    font-size: 30px;
    color: var(--color-primary-6);
}

/* 失败状态 */
.card-error {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.error-icon {
    font-size: 28px;
    color: rgb(var(--danger-6));
}

/* 通用文件名 */
.card-name,
.card-name-center {
    font-size: 11px;
    color: var(--color-text-2);
    text-align: center;
    word-break: break-all;
    padding: 0 4px;
    max-width: 100%;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* 删除按钮 */
.card-delete-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgb(var(--danger-6));
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 10px;
    padding: 0;
    z-index: 5;
}

.card-delete-btn:hover {
    background: rgb(var(--danger-7));
}
</style>
