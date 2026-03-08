<template>
    <!--
        用户管理页面 — 全部由 JSON Schema 驱动，无任何硬编码 template 逻辑。

        核心理念：
          1. ProTable  — 通过 columns 配置生成表格（含搜索、分页、工具栏），
                         通过 requestApi 自动接管数据加载与刷新。
          2. ProForm   — 通过 schemas / items 配置生成表单（含联动显隐与校验），
                         完全不需要手写 <a-form-item>。
          3. ProModal  — requestApi 自动接管 loading、关闭与错误保持。

        只需修改下方的 columns / formItems / mockApi 即可完成一个完整的 CRUD 页面。
    -->
    <div class="user-management">

        <!-- ============================
             主体：用户列表表格
             ============================ -->
        <ProTable ref="tableRef" title="用户列表" :columns="columns" :request-api="fetchUsers" :default-page-size="10"
            row-key="id">
            <!-- 表格右上角：新增按钮 -->
            <template #toolbar>
                <a-button type="primary" @click="openDrawer('create')">
                    <template #icon><icon-plus /></template>
                    新增用户
                </a-button>
            </template>

            <!-- 头像列：渲染圆形头像 -->
            <template #avatar="{ record }">
                <a-avatar :size="36" :image-url="record.avatar"
                    :style="{ backgroundColor: record.avatar ? 'transparent' : 'var(--color-primary-6)' }">
                    {{ record.avatar ? '' : record.name?.[0] }}
                </a-avatar>
            </template>

            <!-- 状态列：可点击切换的开关 -->
            <template #status="{ record }">
                <a-switch :model-value="record.status === 1" size="small"
                    @change="(v: boolean) => handleStatusChange(record, v)" />
            </template>

            <!-- 操作列 -->
            <template #action="{ record }">
                <a-space>
                    <a-link @click="openDrawer('edit', record)">
                        <icon-edit /> 编辑
                    </a-link>
                    <a-popconfirm content="确认删除该用户？此操作不可撤销。" type="warning" @ok="handleDelete(record)">
                        <a-link status="danger">
                            <icon-delete /> 删除
                        </a-link>
                    </a-popconfirm>
                </a-space>
            </template>
        </ProTable>

        <!-- ============================
             新增 / 编辑抽屉
             ============================ -->
        <a-drawer v-model:visible="drawerVisible" :title="drawerTitle" :width="520" unmount-on-close>
            <!-- 表单区：由 ProForm 驱动，所有字段通过 JSON Schema (items) 描述 -->
            <ProForm ref="formRef" v-model="formData" :items="formItems" :config="{ autoLabelWidth: true }">
                <!-- 头像上传：使用 upload component，以 slot 形式接入 SingleUpload -->
                <template #avatarSlot="{ modelRef }">
                    <SingleUpload v-model="modelRef.value" accept="image/*" :max-size="5" title="上传头像"
                        hint="建议尺寸 200×200" />
                </template>
            </ProForm>

            <!-- 底部操作区 -->
            <template #footer>
                <a-space>
                    <a-button @click="drawerVisible = false">取消</a-button>
                    <a-button type="primary" :loading="submitLoading" @click="handleSubmit">
                        保存
                    </a-button>
                </a-space>
            </template>
        </a-drawer>

    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Message } from '@arco-design/web-vue';
import { ProTable, ProForm, SingleUpload } from 'rongshiyi-ui-vue';
import type { FormItemConfig, ProColumnData } from 'rongshiyi-ui-vue';

// ============================================================
// 1. 类型定义
// ============================================================
interface User {
    id: number;
    name: string;
    avatar?: string;
    role: 'admin' | 'editor' | 'viewer';
    accountType: 'personal' | 'enterprise';
    company?: string;
    status: 0 | 1;
    createdAt: string;
}

// ============================================================
// 2. ProTable 列配置（JSON Schema 驱动表格列渲染）
//
//    每一项仅描述"这列是什么"，渲染/搜索/宽度由 ProTable 解读。
//    开发者永远不需要手写 <a-table-column>。
// ============================================================
const columns: ProColumnData[] = [
    {
        title: '头像',
        dataIndex: 'avatar',
        slotName: 'avatar',      // → <template #avatar>
        width: 72,
        searchable: false,
    },
    {
        title: '姓名',
        dataIndex: 'name',
        searchable: true,
        valueType: 'input',       // 搜索框类型
    },
    {
        title: '角色',
        dataIndex: 'role',
        searchable: true,
        valueType: 'select',
        options: [
            { label: '管理员', value: 'admin' },
            { label: '编辑者', value: 'editor' },
            { label: '访客', value: 'viewer' },
        ],
    },
    {
        title: '状态',
        dataIndex: 'status',
        slotName: 'status',
        width: 90,
    },
    {
        title: '注册时间',
        dataIndex: 'createdAt',
        valueType: 'date',
        width: 160,
    },
    {
        title: '操作',
        dataIndex: 'action',
        slotName: 'action',
        fixed: 'right',
        width: 140,
        searchable: false,
    },
];

// ============================================================
// 3. ProForm 表单配置（JSON Schema 驱动表单字段渲染）
//
//    每一项描述"这个字段怎么输入"，校验 / 联动 / 布局全在配置中。
//    开发者永远不需要手写 <a-form-item>。
// ============================================================
const formItems = computed<FormItemConfig[]>(() => [
    {
        component: 'input',
        name: 'name',
        label: '姓名',
        span: 24,
        rules: [{ required: true, message: '请填写姓名' }],
        options: { placeholder: '请输入姓名', maxlength: 50 },
    },
    {
        // 使用具名插槽 'avatarSlot' 接入 SingleUpload，ProForm 会把它渲染在对应 form-item 中
        component: 'avatarSlot',
        name: 'avatar',
        label: '头像',
        span: 24,
    },
    {
        component: 'radio',
        name: 'accountType',
        label: '账号类型',
        span: 24,
        options: {
            items: [
                { label: '个人账号', value: 'personal' },
                { label: '企业账号', value: 'enterprise' },
            ],
        },
    },
    {
        component: 'input',
        name: 'company',
        label: '企业名称',
        span: 24,
        // 联动显隐：仅当 accountType === 'enterprise' 时出现
        // $ 指向当前 formData，字符串表达式由 ProForm 内部 eval 执行
        hideHandle: "$.accountType !== 'enterprise'",
        rules: [{ required: true, message: '请填写企业名称' }],
        options: { placeholder: '请输入企业名称' },
    },
    {
        component: 'select',
        name: 'role',
        label: '角色',
        span: 24,
        rules: [{ required: true, message: '请选择角色' }],
        options: {
            items: [
                { label: '管理员', value: 'admin' },
                { label: '编辑者', value: 'editor' },
                { label: '访客', value: 'viewer' },
            ],
        },
    },
]);

// ============================================================
// 4. Mock 数据 — 实际项目替换为真实 axios/fetch 调用即可
// ============================================================
const MOCK_USERS: User[] = Array.from({ length: 35 }, (_, i) => ({
    id: i + 1,
    name: `用户 ${i + 1}`,
    avatar: i % 3 === 0 ? `https://picsum.photos/seed/${i}/200/200` : undefined,
    role: (['admin', 'editor', 'viewer'] as const)[i % 3],
    accountType: i % 4 === 0 ? 'enterprise' : 'personal',
    company: i % 4 === 0 ? `公司 ${i}` : undefined,
    status: (i % 5 === 0 ? 0 : 1) as 0 | 1,
    createdAt: new Date(Date.now() - i * 86400_000 * 3).toLocaleDateString('zh-CN'),
}));

/**
 * requestApi：ProTable 会自动传入 { page, pageSize, ...searchParams }
 * 返回值结构 { data: T[], total: number } 即可完成分页。
 */
async function fetchUsers(params: Record<string, any>) {
    await new Promise(r => setTimeout(r, 400)); // 模拟网络延迟
    let list = [...MOCK_USERS];

    // 关键字搜索
    if (params.name) list = list.filter(u => u.name.includes(params.name));
    if (params.role) list = list.filter(u => u.role === params.role);

    const page = params.page ?? 1;
    const size = params.pageSize ?? 10;
    return {
        data: list.slice((page - 1) * size, page * size),
        total: list.length,
    };
}

// ============================================================
// 5. 状态联动
// ============================================================
const tableRef = ref();
const formRef = ref();

// 抽屉控制
const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const drawerTitle = computed(() => drawerMode.value === 'create' ? '新增用户' : '编辑用户');

// 表单数据（对象用 reactive 更自然，这里用 ref 配合 ProForm v-model）
const formData = ref<Partial<User>>({});
const submitLoading = ref(false);

/** 打开新增/编辑抽屉 */
function openDrawer(mode: 'create' | 'edit', row?: User) {
    drawerMode.value = mode;
    formData.value = mode === 'edit' ? { ...row } : { accountType: 'personal', role: 'viewer', status: 1 };
    drawerVisible.value = true;
}

/** 状态开关切换 */
async function handleStatusChange(record: User, active: boolean) {
    record.status = active ? 1 : 0;
    Message.success(`已${active ? '启用' : '禁用'} ${record.name}`);
    // 实际项目：await api.updateStatus(record.id, record.status)
}

/** 删除用户 */
async function handleDelete(record: User) {
    await new Promise(r => setTimeout(r, 300));
    Message.success(`已删除用户 ${record.name}`);
    // 实际项目：await api.deleteUser(record.id)
    tableRef.value?.refresh();
}

/** 保存表单（新增 / 编辑均走此函数） */
async function handleSubmit() {
    const valid = await formRef.value?.validate();
    if (!valid) return; // 未通过校验

    submitLoading.value = true;
    try {
        await new Promise(r => setTimeout(r, 600)); // 模拟提交
        Message.success(drawerMode.value === 'create' ? '新增成功' : '保存成功');
        drawerVisible.value = false;
        tableRef.value?.refresh(); // 刷新 ProTable 数据
    } finally {
        submitLoading.value = false;
    }
}
</script>

<style scoped>
.user-management {
    width: 100%;
}
</style>
