import { useState } from 'react';
import { Card, message } from 'antd';
import { ProForm } from 'rongshiyi-ui-react';
import type { FormItemConfig } from 'rongshiyi-ui-react';
import '../App.css';

const formItems: FormItemConfig[] = [
    {
        component: 'input',
        name: 'username',
        label: '用户名',
        tips: '长度 2-20 位',
        options: { placeholder: '请输入用户名', maxlength: 20 },
        rules: [
            { required: true, message: '请输入用户名' },
            { min: 2, max: 20, message: '用户名长度应为 2-20 位' },
        ],
    },
    {
        component: 'select',
        name: 'role',
        label: '角色',
        options: {
            placeholder: '请选择角色',
            items: [
                { label: '管理员', value: 'admin' },
                { label: '普通员工', value: 'staff' },
                { label: '实习生', value: 'intern' },
            ],
        },
        rules: [{ required: true, message: '请选择角色' }],
    },
    {
        component: 'radio',
        name: 'gender',
        label: '性别',
        options: {
            items: [
                { label: '男', value: 'male' },
                { label: '女', value: 'female' },
            ],
        },
    },
    {
        component: 'checkboxGroup',
        name: 'permissions',
        label: '权限',
        options: {
            items: [
                { label: '读取', value: 'read' },
                { label: '写入', value: 'write' },
                { label: '审批', value: 'approve' },
            ],
        },
        message: '只读态会自动把 value 翻译成中文 label',
    },
    {
        component: 'date',
        name: 'joinDate',
        label: '入职日期',
        options: {
            format: 'YYYY/MM/DD',
            placeholder: '请选择入职日期',
        },
    },
    {
        component: 'switch',
        name: 'enabled',
        label: '是否启用',
    },
];

export default function FormDemo() {
    const [formModel, setFormModel] = useState<Record<string, any>>({
        username: '张三',
        role: 'staff',
        gender: 'male',
        permissions: ['read', 'approve'],
        enabled: true,
    });

    return (
        <div className="playground-react-form-grid">
            <Card title="ProForm 编辑态（可输入与校验）" bordered={false}>
                <ProForm
                    modelValue={formModel}
                    items={formItems}
                    onUpdateModelValue={setFormModel}
                    onSubmit={(values: Record<string, any>) => {
                        console.log('ProForm submit:', values);
                        message.success('提交成功，数据已输出到控制台');
                    }}
                />
            </Card>
            <Card title="ProForm 只读态（readonly=true）" bordered={false}>
                <ProForm
                    modelValue={formModel}
                    items={formItems}
                    readonly
                />
            </Card>
        </div>
    );
}
