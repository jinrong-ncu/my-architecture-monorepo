<template>
    <div class="pro-table-form-demo">
        <h3 style="margin-top: 0; margin-bottom: 16px;">ProTableForm 可编辑表格演示</h3>

        <a-alert type="info" style="margin-bottom: 16px;">
            <template #title>功能说明</template>
            <div style="font-size: 12px; line-height: 1.6;">
                支持深层路径双向绑定（如 department.name）、列级只读渲染、行级增删、单元格校验。
            </div>
        </a-alert>

        <a-space style="margin-bottom: 16px;">
            <a-button type="primary" @click="handleAddRow">新增行</a-button>
            <a-button status="success" @click="handleValidate">提交校验</a-button>
        </a-space>

        <ProTableForm ref="tableFormRef" v-model="tableRows" :columns="columns" :show-action="true" action-title="操作" />

        <a-alert type="normal" style="margin-top: 16px;">
            <template #title>当前数据快照</template>
            <pre class="json-preview">{{ JSON.stringify(tableRows, null, 2) }}</pre>
        </a-alert>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ProTableForm } from 'rongshiyi-ui-vue';
import type { ProTableFormColumn, ProTableFormExpose } from 'rongshiyi-ui-vue';

const tableFormRef = ref<ProTableFormExpose>();

const tableRows = ref<Record<string, any>[]>([
    {
        name: 'Alice',
        status: 1,
        department: {
            name: '研发中心'
        },
        category: 2,
    },
    {
        name: '',
        status: 0,
        department: {
            name: ''
        },
        category: 1,
    },
]);

const columns: ProTableFormColumn[] = [
    {
        title: '姓名',
        dataIndex: 'name',
        component: 'input',
        props: {
            placeholder: '请输入姓名',
            allowClear: true,
        },
        rules: [{ required: true, message: '姓名不能为空' }],
    },
    {
        title: '状态',
        dataIndex: 'status',
        component: 'select',
        options: [
            { label: '启用', value: 1 },
            { label: '禁用', value: 0 },
        ],
        props: {
            placeholder: '请选择状态',
            allowClear: true,
        },
        rules: [{ required: true, message: '状态不能为空' }],
    },
    {
        title: '部门名称（嵌套）',
        dataIndex: 'department.name',
        component: 'input',
        props: {
            placeholder: '请输入部门名称',
        },
        rules: [{ required: true, message: '部门名称不能为空' }],
    },
    {
        title: '分类（只读翻译）',
        dataIndex: 'category',
        component: 'select',
        readonly: true,
        options: [
            { label: 'A 类', value: 1 },
            { label: 'B 类', value: 2 },
            { label: 'C 类', value: 3 },
        ],
    },
];

const handleAddRow = () => {
    tableFormRef.value?.addItem({
        name: '',
        status: undefined,
        category: 1,
        department: {
            name: '',
        },
    });
};

const handleValidate = async () => {
    const valid = await tableFormRef.value?.validate();
    if (!valid) {
        console.warn('[ProTableForm] 校验失败，请检查红色提示');
        return;
    }

    console.log('[ProTableForm] 校验通过，最终数据：', tableRows.value);
};
</script>

<style scoped>
.pro-table-form-demo {
    width: 100%;
}

.json-preview {
    margin: 0;
    font-size: 12px;
    white-space: pre-wrap;
    max-height: 220px;
    overflow: auto;
    line-height: 1.6;
}
</style>
