<template>
    <div class="playground-layout">
        <div class="header">
            <h2>@rong/ui-vue - ProTable 本地沙箱压测台</h2>
        </div>

        <!-- 核心 ProTable 组件展示区 -->
        <ProTable :columns="columns" :requestApi="fetchMockData" />
    </div>
</template>

<script setup lang="ts">
import { ProTable } from '@rong/ui-vue';
import type { ProColumnData } from '@rong/ui-vue';

// ==========================================
// 1. 定义表盘列基础数据配置
// ==========================================
const columns: ProColumnData[] = [
    {
        title: '员工姓名',
        dataIndex: 'name',
        width: 150,
        search: true, // 开启上层表单搜索
        valueType: 'input',
        tooltip: '员工的真实花名或姓名',
        copyable: true
    },
    {
        title: '头像照片',
        dataIndex: 'avatar',
        width: 80,
        valueType: 'image'
    },
    {
        title: '个人简介',
        dataIndex: 'bio',
        width: 150,
        valueType: 'html',
        tooltip: '由富文本编辑器生成的 HTML 代码'
    },
    {
        title: '技术栈',
        dataIndex: 'skills',
        width: 180,
        valueType: 'array',
        tooltip: '数组格式的数据，自动转换为逗号分隔'
    },
    {
        title: '博客链接',
        dataIndex: 'blogUrl',
        width: 120,
        valueType: 'link',
        copyable: true
    },
    {
        title: '当前状态',
        dataIndex: 'status',
        width: 100,
        search: true, // 开启过滤
        valueType: 'select',
        options: [
            { label: '在职', value: 'active' },
            { label: '离职', value: 'dimission' }
        ]
    },
    {
        title: '系统账号',
        dataIndex: 'accountEnabled',
        width: 100,
        valueType: 'switch',
        switchConfig: {
            activeText: '启用',
            inactiveText: '封禁',
            onChange: (val, row) => console.log('修改账号状态:', val, row.name)
        }
    },
    {
        title: '入职时间',
        dataIndex: 'entryDate',
        width: 150,
        search: true,
        valueType: 'date',
        dateFormat: 'YYYY/MM/DD'
    },
    {
        title: '操作',
        dataIndex: 'action',
        width: 180,
        align: 'center',
        fixed: 'right',
        valueType: 'operation',
        operation: [
            {
                label: '查看',
                icon: 'icon-eye',
                onClick: (row) => console.log('查看:', row.name)
            },
            {
                label: '编辑',
                icon: 'icon-edit',
                onClick: (row) => console.log('编辑:', row.name)
            },
            {
                label: '封号',
                icon: 'icon-stop',
                disabled: (row) => !row.accountEnabled,
                onClick: (row) => console.log('封号:', row.name)
            },
            {
                label: '删除',
                icon: 'icon-delete',
                onClick: (row) => console.log('删除:', row.name)
            }
        ]
    }
];

// ==========================================
// 2. 编写模拟数据与网络请求 API
// ==========================================
/**
 * 模拟的网络请求延时并返回数据
 * 目的是压测 ProTable 的 loading 和翻页响应能力
 */
const fetchMockData = async (params: any) => {
    console.log('ProTable 触发查询，提交参数为：', params);

    // 主动挂挂载 1 秒延时，肉眼观察组件自身封装的 Loading 动画拦截是否生效
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 构造并返回 5 条前端写死的范例数据
    const mockTableData = Array.from({ length: 5 }).map((_, idx) => ({
        id: idx + 1 + (params.page - 1) * params.pageSize,
        name: `架构体验官 ${idx + 1}`,
        avatar: 'https://p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/a8c8cdb109cb051163646151a4a5083b.png~tplv-uwbnlip3yd-webp.webp',
        bio: '<span style="color: blue">追求极致体验</span>',
        skills: ['Vue3', 'React', 'Node.js', 'Rust'],
        blogUrl: 'https://liujinrong.cn',
        status: idx % 3 === 0 ? 'dimission' : 'active',
        accountEnabled: idx % 2 === 0,
        entryDate: `2026-03-0${(idx % 9) + 1}`,

    }));

    // 需要解构一层返回结构适配组件约定的响应外壳 { data, total }
    return {
        data: mockTableData,
        total: 36 // 模拟具有分页的情况
    };
};

</script>

<style scoped>
.playground-layout {
    min-height: 100vh;
    background-color: var(--color-fill-2);
    padding: 24px;
}

.header {
    margin-bottom: 24px;
}

.header h2 {
    margin: 0;
    color: var(--color-text-1);
}

.content {
    background: #ffffff;
}
</style>
