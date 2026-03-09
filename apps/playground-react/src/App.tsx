
import { Space, Button, message } from 'antd';
import { ProTable } from 'rongshiyi-ui-react';
import type { ProColumnsType } from 'rongshiyi-ui-react';

interface UserItem {
    id: number;
    name: string;
    age: number;
    role: string;
}

const mockData: UserItem[] = Array.from({ length: 55 }).map((_, idx) => ({
    id: idx + 1,
    name: `测试用户 ${idx + 1}`,
    age: 20 + (idx % 30),
    role: idx % 3 === 0 ? 'Admin' : 'User',
}));

const mockRequest = async (params: { current: number; pageSize: number;[key: string]: any }) => {
    console.log('Fetching with params:', params);
    return new Promise<{ data: UserItem[]; total: number; success: boolean }>((resolve) => {
        setTimeout(() => {
            const { current, pageSize } = params;
            const start = (current - 1) * pageSize;
            const end = start + pageSize;
            resolve({
                data: mockData.slice(start, end),
                total: mockData.length,
                success: true,
            });
        }, 1000);
    });
};

const columns: ProColumnsType<UserItem> = [
    {
        title: 'ID',
        dataIndex: 'id',
        width: 80,
    },
    {
        title: '姓名',
        dataIndex: 'name',
        valueType: 'text',
    },
    {
        title: '年龄',
        dataIndex: 'age',
    },
    {
        title: '角色',
        dataIndex: 'role',
        valueType: 'select',
    },
    {
        title: '隐藏列',
        dataIndex: 'hidden',
        hideInTable: true,
    },
    {
        title: '操作',
        key: 'action',
        width: 150,
        render: (_, record: UserItem) => (
            <Space size="small">
                <Button type="link" size="small" onClick={() => message.info(`编辑 ${record.name}`)}>编辑</Button>
                <Button type="link" danger size="small" onClick={() => message.error(`删除 ${record.name}`)}>删除</Button>
            </Space>
        ),
    },
];

export default function App() {
    return (
        <div style={{ padding: '24px', backgroundColor: '#f3f4f6', minHeight: '100vh', margin: '-8px' }}>
            <ProTable<UserItem>
                headerTitle="用户列表（ProTable 测试）"
                rowKey="id"
                request={mockRequest}
                columns={columns}
                toolBarRender={() => [
                    <Button key="add" type="primary" onClick={() => message.success('新建成功')}>
                        新建用户
                    </Button>,
                ]}
            />
        </div>
    );
}
