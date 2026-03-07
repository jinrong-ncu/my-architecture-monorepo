<template>
    <div class="pro-upload">
        <!-- 
            ProUpload：对 Arco Design a-upload 的封装，
            支持 v-model 绑定已上传文件列表
        -->
        <a-upload :file-list="fileList" :action="action" :multiple="multiple" :limit="limit" :accept="accept"
            :disabled="disabled" :list-type="listType" :tip="tip" :show-file-list="true" @change="handleChange"
            v-bind="$attrs">
            <!-- 自定义触发区域，支持外部透传 slot -->
            <slot>
                <a-button>
                    <template #icon><icon-upload /></template>
                    点击上传
                </a-button>
            </slot>
        </a-upload>
    </div>
</template>

<script setup lang="ts">
import type { FileItem } from '@arco-design/web-vue';

interface Props {
    /** v-model 绑定的文件列表 */
    modelValue?: FileItem[];
    /** 上传接口地址，不传则使用手动模式 */
    action?: string;
    /** 是否支持多文件上传 */
    multiple?: boolean;
    /** 文件数量上限 */
    limit?: number;
    /** 允许的文件类型，如 image/* */
    accept?: string;
    /** 是否禁用 */
    disabled?: boolean;
    /** 显示列表格式 text | picture | picture-card */
    listType?: 'text' | 'picture' | 'picture-card';
    /** 提示文字 */
    tip?: string;
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: () => [],
    multiple: false,
    listType: 'text',
});

const emit = defineEmits<{
    'update:modelValue': [files: FileItem[]];
    'change': [fileList: FileItem[], file: FileItem];
}>();

// 将 props.modelValue 作为展示数据
const fileList = computed(() => props.modelValue || []);

// 监听 a-upload 的 change 事件，同步更新 v-model
const handleChange = (files: FileItem[], file: FileItem) => {
    emit('update:modelValue', files);
    emit('change', files, file);
};
</script>

<script lang="ts">
import { computed } from 'vue';
export default { name: 'ProUpload', inheritAttrs: false };
</script>

<style scoped>
.pro-upload {
    width: 100%;
}
</style>
