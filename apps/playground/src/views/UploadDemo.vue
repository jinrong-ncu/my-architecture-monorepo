<template>
    <div class="upload-demo">
        <h3 style="margin-top: 0; margin-bottom: 24px;">ProUpload 高并发上传组件压测台</h3>

        <a-space direction="vertical" :size="24" fill>

            <!-- ======================== A. 单文件压测 ======================== -->
            <a-card title="测试用例 A：SingleUpload 单文件直传" :bordered="true">
                <template #extra>
                    <a-tag color="arcoblue">图片/视频/文件 三态预览</a-tag>
                </template>

                <a-space :size="40" align="start">
                    <!-- 头像上传 -->
                    <div>
                        <p class="case-label">图片上传（头像场景）</p>
                        <SingleUpload v-model="singleFileUrl" accept="image/*" :max-size="100" title="点击上传头像"
                            icon="icon-plus" :api-obj="activeApi" />
                    </div>
                    <!-- 视频上传 -->
                    <div>
                        <p class="case-label">视频上传（凭证场景）</p>
                        <SingleUpload v-model="singleVideoUrl" accept="video/*" :max-size="150" title="上传视频文件"
                            icon="icon-video-camera" :api-obj="activeApi" />
                    </div>
                    <!-- 文档上传 -->
                    <div>
                        <p class="case-label">文档上传（合同场景）</p>
                        <SingleUpload v-model="singleDocUrl" accept=".pdf,.docx,.xlsx" :max-size="120" title="上传合同文件"
                            icon="icon-file" :api-obj="activeApi" />
                    </div>
                </a-space>
            </a-card>

            <!-- ======================== B. 多文件并发压测 ======================== -->
            <a-card title="测试用例 B：MultipleUpload 高并发拖拽队列" :bordered="true">
                <template #extra>
                    <a-tag color="green">maxConcurrent=2 并发压测</a-tag>
                </template>

                <a-alert type="info" style="margin-bottom: 16px;">
                    <template #title>压测说明</template>
                    一次性选择 4~6 个文件，观察同时上传的卡片进度——最多只有 2 个同时推进，
                    其余卡片在进度 0% 处等待令牌释放后才开始滚动，这就是 <code>useUploadQueue</code> 并发调度引擎在运作。
                </a-alert>

                <MultipleUpload v-model="multipleFileList" drag :max-concurrent="2" :max-size="20"
                    :api-obj="activeApi" />
            </a-card>

            <!-- ======================== 实时数据大屏 ======================== -->
            <a-card title="实时数据大屏（v-model 双向绑定验证）" :bordered="true">
                <a-row :gutter="16">
                    <a-col :span="8">
                        <p class="case-label">singleFileUrl（图片）</p>
                        <pre class="data-snapshot">{{ JSON.stringify(singleFileUrl, null, 2) || 'null' }}</pre>
                    </a-col>
                    <a-col :span="8">
                        <p class="case-label">singleVideoUrl / singleDocUrl</p>
                        <pre
                            class="data-snapshot">{{ JSON.stringify({ video: singleVideoUrl, doc: singleDocUrl }, null, 2) }}</pre>
                    </a-col>
                    <a-col :span="8">
                        <p class="case-label">multipleFileList（数组）</p>
                        <pre class="data-snapshot">{{ JSON.stringify(multipleFileList, null, 2) || '[]' }}</pre>
                    </a-col>
                </a-row>
            </a-card>

        </a-space>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { SingleUpload, MultipleUpload, createS3Uploader } from '@rong/ui-vue';

// ==========================================
// 1. 响应式数据绑定
// ==========================================
const singleFileUrl = ref<string | undefined>(undefined);
const singleVideoUrl = ref<string | undefined>(undefined);
const singleDocUrl = ref<string | undefined>(undefined);
const multipleFileList = ref<any[]>([]);

// ==========================================
// 2a. 真实 R2/S3 上传 API（从 .env.local 读取配置）
// ==========================================
const realUploadApi = createS3Uploader();

// ==========================================
// 2b. Mock API（备用，切换为此可在本地离线压测）
// ==========================================
function mockUploadApi(file: File, onProgress: (percent: number) => void): Promise<{ url: string }> {
    return new Promise((resolve) => {
        let percent = 0;
        const timer = setInterval(() => {
            percent += 10;
            onProgress(Math.min(percent, 100));
            if (percent >= 100) {
                clearInterval(timer);
                resolve({ url: `https://picsum.photos/200/200?random=${Math.random()}` });
            }
        }, 300);
    });
}

// 自动检测：若 .env.local 尚未填写真实密钥，则降级使用 Mock API 进行离线压测
const envAccessKey = ((import.meta as any).env?.VITE_S3_ACCESS_KEY_ID ?? '') as string;
const activeApi = (!envAccessKey || envAccessKey.startsWith('你'))
    ? mockUploadApi
    : realUploadApi;
</script>

<style scoped>
.upload-demo {
    width: 100%;
}

.case-label {
    margin: 0 0 10px;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-2);
}

.data-snapshot {
    background: var(--color-fill-2);
    border: 1px solid var(--color-border-2);
    border-radius: 4px;
    padding: 12px;
    font-size: 12px;
    line-height: 1.7;
    white-space: pre-wrap;
    word-break: break-all;
    min-height: 80px;
    max-height: 240px;
    overflow-y: auto;
    color: var(--color-text-1);
    margin: 0;
}

code {
    background: var(--color-fill-3);
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 12px;
    color: rgb(var(--primary-6));
}
</style>
