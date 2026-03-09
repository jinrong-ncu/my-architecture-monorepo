import { Button, message, Tag } from 'antd';
import { ProTable } from 'rongshiyi-ui-react';
import type { ProColumnType } from 'rongshiyi-ui-react';

interface UserItem {
    id: string;
    name: string;
    age: number;
    role: number;
    status: boolean;
    joinDate: string;
}

const mockData: UserItem[] = Array.from({ length: 55 }).map((_, idx) => ({
    id: `USR-${1000 + idx}`,
    name: `测试员工 ${idx + 1}`,
    age: 20 + (idx % 30),
    role: idx % 3,
    status: idx % 4 !== 0,
    joinDate: new Date(Date.now() - idx * 86400000 * 5).toISOString(),
    avatar: `https://i.pravatar.cc/150?img=${idx + 1}`,
}));

const mockRequest = async (params: Record<string, any>) => {
    console.log('Fetching with params:', params);
    return new Promise<{ data: UserItem[]; total: number; success: boolean }>((resolve) => {
        setTimeout(() => {
            let filteredData = [...mockData];

            // 模拟搜索筛选处理
            if (params.name) {
                filteredData = filteredData.filter(item => item.name.includes(params.name));
            }
            if (params.role !== undefined) {
                filteredData = filteredData.filter(item => item.role === params.role);
            }

            const current = params.current || 1;
            const pageSize = params.pageSize || 10;
            const start = (current - 1) * pageSize;
            const end = start + pageSize;
            resolve({
                data: filteredData.slice(start, end),
                total: filteredData.length,
                success: true,
            });
        }, 800);
    });
};

const columns: ProColumnType<UserItem>[] = [
    {
        title: '员工编号',
        dataIndex: 'id',
        width: 120,
        search: true, // 在搜索表单中显示
        copyable: true, // 文本旁自动展示复制图标
        tooltip: '系统唯一识别码',
    },
    {
        title: '头像',
        dataIndex: 'avatar',
        valueType: 'image',
    },
    {
        title: '姓名',
        dataIndex: 'name',
        search: true,
    },
    {
        title: '年龄',
        dataIndex: 'age',
        width: 80,
        align: 'center',
        hideInTable: true, // 默认隐藏，可在列设置中切换
    },
    {
        title: '角色',
        dataIndex: 'role',
        valueType: 'select',
        search: true,
        options: [
            { label: '管理员', value: 0 },
            { label: '普通员工', value: 1 },
            { label: '实习生', value: 2 },
        ],
        render: (_: any, record: UserItem) => {
            const colors = ['red', 'green', 'blue'];
            const labels = ['管理员', '普通员工', '实习生'];
            return <Tag color={colors[record.role]}>{labels[record.role]}</Tag>;
        },
    },
    {
        title: '账号状态',
        dataIndex: 'status',
        valueType: 'switch',
        switchConfig: {
            activeText: '正常',
            inactiveText: '冻结',
            onChange: (val: any, row: UserItem) => message.success(`切换 ${row.name} 状态至 ${val ? '正常' : '冻结'}`),
        },
    },
    {
        title: '入职日期',
        dataIndex: 'joinDate',
        valueType: 'date',
        dateFormat: 'YYYY/MM/DD',
        search: true, // 支持按日期搜索
    },
    {
        title: '操作',
        key: 'action',
        width: 200,
        valueType: 'operation',
        operation: [
            {
                label: '编辑',
                onClick: (r: UserItem) => message.info(`编辑: ${r.name}`),
            },
            {
                label: '授权',
                disabled: (r: UserItem) => !r.status, // 冻结状态时禁用
                onClick: (r: UserItem) => message.info(`授权: ${r.name}`),
            },
            {
                label: '删除',
                onClick: (r: UserItem) => message.error(`删除: ${r.name} - ${r.id}`),
            },
        ],
    },
];

export default function App() {
    return (
        <div style={{ padding: '24px', backgroundColor: '#f3f4f6', minHeight: '100vh', margin: '-8px' }}>
            <ProTable<UserItem>
                cacheKey="demo-user-list-table"
                headerTitle=""
                rowKey="id"
                requestApi={mockRequest}
                columns={columns}
                toolBarRender={() => [
                    <Button key="add" type="primary" onClick={() => message.success('新建表单触发')}>
                        新建员工
                    </Button>,
                    <Button key="export" onClick={() => message.info('正在导出...')}>
                        导出
                    </Button>,
                ]}
            />
        </div>
    );
}
