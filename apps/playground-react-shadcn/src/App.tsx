import React, { useState } from 'react';
import { ProTable, ProForm } from 'rongshiyi-ui-react-shadcn';
import type { ProColumnType, FormItemConfig } from 'rongshiyi-ui-react-shadcn';
import { Plus, UserPlus, FileText } from 'lucide-react';
import { Button } from 'rongshiyi-ui-react-shadcn/src/components/ui/button';

const App: React.FC = () => {
    const [readonly, setReadonly] = useState(false);
    const [formData, setFormData] = useState({
        username: '荣十一',
        role: 'admin',
        isActive: true,
        birthday: '1995-10-24'
    });

    // ProTable Mock Data
    const columns: ProColumnType[] = [
        { title: 'ID', dataIndex: 'id', width: 80 },
        { title: '用户名', dataIndex: 'username', search: true, copyable: true },
        { 
            title: '角色', 
            dataIndex: 'role', 
            valueType: 'enum', 
            search: true,
            options: [
                { label: '管理员', value: 'admin' },
                { label: '开发者', value: 'dev' },
                { label: '访客', value: 'guest' }
            ]
        },
        { 
            title: '状态', 
            dataIndex: 'isActive', 
            valueType: 'switch',
            switchConfig: {
                activeText: '启用',
                inactiveText: '禁用',
                onChange: (val, row) => console.log('Switch changed:', val, row)
            }
        },
        { title: '创建日期', dataIndex: 'createdAt', valueType: 'date' },
        {
            title: '操作',
            dataIndex: 'op',
            valueType: 'operation',
            operation: [
                { label: '编辑', onClick: (r) => alert('编辑: ' + r.username) },
                { label: '删除', onClick: (r) => alert('删除: ' + r.id) }
            ]
        }
    ];

    const mockRequest = async (params: any) => {
        console.log('Fetching with params:', params);
        await new Promise(r => setTimeout(r, 1000));
        return {
            data: [
                { id: '1', username: 'Alice', role: 'admin', isActive: true, createdAt: '2024-01-01' },
                { id: '2', username: 'Bob', role: 'dev', isActive: false, createdAt: '2024-02-15' },
                { id: '3', username: 'Charlie', role: 'guest', isActive: true, createdAt: '2024-03-20' },
            ],
            total: 3
        };
    };

    // ProForm Config
    const formItems: FormItemConfig[] = [
        { component: 'divider', name: 'd1', label: '基本信息' },
        { 
            name: 'username', 
            label: '用户名称', 
            component: 'input', 
            rules: { required: true, message: '请输入名称' },
            tips: '建议使用真实姓名'
        },
        { 
            name: 'role', 
            label: '系统角色', 
            component: 'select',
            options: {
                items: [
                    { label: '管理员', value: 'admin' },
                    { label: '开发者', value: 'dev' }
                ]
            }
        },
        { component: 'divider', name: 'd2', label: '权限设置' },
        { name: 'isActive', label: '是否激活', component: 'switch' },
        { name: 'birthday', label: '出生日期', component: 'date' },
        { name: 'bio', label: '个人简介', component: 'textarea', span: 2 }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 space-y-12 max-w-7xl mx-auto">
            <header className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Shadcn React Pro 组件实验室</h1>
                    <p className="text-muted-foreground mt-1">基于 Tailwind CSS 的企业级 UI 基建平移</p>
                </div>
                <div className="flex gap-3">
                    <Button variant={readonly ? "default" : "outline"} onClick={() => setReadonly(!readonly)}>
                        {readonly ? '切换编辑模式' : '查看只读模式'}
                    </Button>
                    <Button variant="outline" size="icon">
                        <FileText className="h-4 w-4" />
                    </Button>
                </div>
            </header>

            <section className="space-y-6">
                <div className="flex items-center gap-2">
                    <UserPlus className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold">ProForm 动态表单</h2>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border">
                    <ProForm 
                        items={formItems} 
                        modelValue={formData} 
                        readonly={readonly}
                        column={2}
                        onUpdateModelValue={setFormData as any}
                        onSubmit={(v) => console.log('Submit Success:', v)}
                    />
                </div>
            </section>

            <section className="space-y-6">
                <div className="flex items-center gap-2">
                    <Plus className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold">ProTable 高级表格</h2>
                </div>
                <ProTable 
                    headerTitle="用户管理列表"
                    columns={columns} 
                    requestApi={mockRequest}
                    cacheKey="react-pro-table"
                    toolBarRender={() => [
                        <Button key="add" className="gap-2">
                            <Plus className="h-4 w-4" />
                            新增用户
                        </Button>
                    ]}
                />
            </section>
        </div>
    );
};

export default App;
