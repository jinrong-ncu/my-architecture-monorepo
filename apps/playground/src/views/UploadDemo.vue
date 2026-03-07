<template>
    <div class="upload-demo">
        <h3 style="margin-top: 0; margin-bottom: 24px;">ProUpload 全模式上传组件压测台</h3>

        <a-space direction="vertical" :size="24" fill>

            <!-- ======================== A. avatar 头像上传 ======================== -->
            <a-card title="模式 A：avatar — 用户头像单传">
                <template #extra><a-tag color="arcoblue">single file · 正方形预览</a-tag></template>
                <a-space :size="40" align="start">
                    <div>
                        <p class="case-label">图片头像</p>
                        <ProUpload v-model="avatarUrl" list-type="avatar" accept="image/*" :max-size="100"
                            title="点击上传头像" :api-obj="activeApi" />
                    </div>
                    <div>
                        <p class="case-label">文档凭证</p>
                        <ProUpload v-model="docUrl" list-type="avatar" accept=".pdf,.docx,.xlsx" :max-size="120"
                            title="上传合同文件" :api-obj="activeApi" />
                    </div>
                </a-space>
            </a-card>

            <!-- ======================== B. picture-card 照片墙 ======================== -->
            <a-card title="模式 B：picture-card — 照片墙相册">
                <template #extra><a-tag color="green">multi file · grid 格</a-tag></template>
                <ProUpload v-model="photoList" list-type="picture-card" accept="image/*" :max-size="20" :max-count="9"
                    title="添加图片" :api-obj="activeApi" />
            </a-card>

            <!-- ======================== C. picture-list 图片列表 ======================== -->
            <a-card title="模式 C：picture-list — 图片+文件名列表">
                <template #extra><a-tag color="orange">multi file · thumbnail list</a-tag></template>
                <ProUpload v-model="pictureList" list-type="picture-list" :max-size="50" title="选择图片/文件"
                    :api-obj="activeApi" />
            </a-card>

            <!-- ======================== D. text 文件列表 (drag) ======================== -->
            <a-card title="模式 D：text — 拖拽上传文件列表（maxConcurrent=2）">
                <template #extra><a-tag color="red">multi file · drag · 并发限制 2</a-tag></template>
                <a-alert type="info" style="margin-bottom: 16px;">
                    <template #title>并发压测</template>
                    拖入 4~6 个文件，最多同时推进 2 个进度条，其余等待令牌释放——<code>useUploadQueue</code> 引擎在运作。
                </a-alert>
                <ProUpload v-model="fileList" list-type="text" drag :max-concurrent="2" :max-size="150"
                    title="点击或拖拽文件到此处" :api-obj="activeApi" />
            </a-card>

            <!-- ======================== 实时数据大屏 ======================== -->
            <a-card title="实时数据大屏（v-model 双向绑定验证）">
                <a-row :gutter="16">
                    <a-col :span="6">
                        <p class="case-label">avatar URL</p>
                        <pre class="snap">{{ JSON.stringify(avatarUrl) ?? 'null' }}</pre>
                    </a-col>
                    <a-col :span="6">
                        <p class="case-label">picture-card 数组</p>
                        <pre class="snap">{{ JSON.stringify(photoList, null, 2) }}</pre>
                    </a-col>
                    <a-col :span="6">
                        <p class="case-label">picture-list 数组</p>
                        <pre class="snap">{{ JSON.stringify(pictureList, null, 2) }}</pre>
                    </a-col>
                    <a-col :span="6">
                        <p class="case-label">text 文件列表</p>
                        <pre class="snap">{{ JSON.stringify(fileList, null, 2) }}</pre>
                    </a-col>
                </a-row>
            </a-card>

        </a-space>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ProUpload, createS3Uploader } from '@rong/ui-vue';

// ==========================================
// 绑定数据
// ==========================================
const avatarUrl = ref<string | undefined>(undefined);
const docUrl = ref<string | undefined>(undefined);
const photoList = ref<any[]>([]);
const pictureList = ref<any[]>([]);
const fileList = ref<any[]>([]);

// ==========================================
// 真实 S3/R2 上传 API
// ==========================================
const realUploadApi = createS3Uploader();

// Mock API（.env.local 未配置时自动降级）
function mockUploadApi(file: File, onProgress: (p: number) => void): Promise<{ url: string }> {
    return new Promise(resolve => {
        let p = 0;
        const t = setInterval(() => {
            p += 10; onProgress(Math.min(p, 100));
            if (p >= 100) { clearInterval(t); resolve({ url: `https://picsum.photos/200/200?random=${Math.random()}` }); }
        }, 300);
    });
}

const envKey = ((import.meta as any).env?.VITE_S3_ACCESS_KEY_ID ?? '') as string;
const activeApi = (!envKey || envKey.startsWith('你')) ? mockUploadApi : realUploadApi;
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

.snap {
    background: var(--color-fill-2);
    border: 1px solid var(--color-border-2);
    border-radius: 4px;
    padding: 10px;
    font-size: 11px;
    line-height: 1.7;
    white-space: pre-wrap;
    word-break: break-all;
    min-height: 60px;
    max-height: 200px;
    overflow-y: auto;
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
