import { useState } from 'react';
import { Card, message } from 'antd';
import { ProForm } from 'rongshiyi-ui-react';
import type { FormItemConfig } from 'rongshiyi-ui-react';

const formItems: FormItemConfig[] = [
    {
        component: 'divider',
        name: 'basicDivider',
        label: '基础信息',
        tips: '用于演示常见输入组件',
    },
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
        component: 'textarea',
        name: 'bio',
        label: '个人简介',
        options: {
            placeholder: '请输入个人简介',
            maxlength: 120,
        },
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
        component: 'cascader',
        name: 'region',
        label: '所属区域',
        options: {
            placeholder: '请选择区域',
            items: [
                {
                    label: '浙江',
                    value: 'zj',
                    children: [
                        { label: '杭州', value: 'hz' },
                        { label: '宁波', value: 'nb' },
                    ],
                },
                {
                    label: '江苏',
                    value: 'js',
                    children: [
                        { label: '南京', value: 'nj' },
                        { label: '苏州', value: 'sz' },
                    ],
                },
            ],
        },
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
    {
        component: 'divider',
        name: 'advancedDivider',
        label: '高级配置',
        tips: '用于演示 number/slider/tags 与动态规则',
    },
    {
        component: 'number',
        name: 'age',
        label: '年龄',
        options: {
            min: 18,
            max: 65,
            step: 1,
            placeholder: '请输入年龄',
        },
    },
    {
        component: 'slider',
        name: 'score',
        label: '绩效评分',
        options: {
            min: 0,
            max: 100,
            step: 5,
        },
    },
    {
        component: 'tags',
        name: 'skills',
        label: '技能标签',
        options: {
            placeholder: '输入后回车新增标签',
        },
    },
    {
        component: 'checkbox',
        name: 'hasEmergencyContact',
        label: '紧急联系人',
        options: {
            placeholder: '我已填写紧急联系人信息',
        },
    },
    {
        component: 'input',
        name: 'emergencyContact',
        label: '联系人手机号',
        options: {
            placeholder: '请输入紧急联系人手机号',
        },
        hideHandle: '!$.hasEmergencyContact',
        requiredHandle: '$.hasEmergencyContact',
    },
];

export default function ProFormPage() {
    const [formModel, setFormModel] = useState<Record<string, any>>({
        username: '张三',
        bio: '负责中后台系统架构与组件设计',
        role: 'staff',
        region: ['zj', 'hz'],
        gender: 'male',
        permissions: ['read', 'approve'],
        age: 28,
        score: 75,
        skills: ['React', 'TypeScript'],
        hasEmergencyContact: true,
        emergencyContact: '13800001111',
        enabled: true,
    });

    return (
        <div className="playground-react-form-page">
            <Card title="实时 JSON 数据" bordered={false} className="playground-react-json-card">
                <pre className="playground-react-json-block">{JSON.stringify(formModel, null, 2)}</pre>
            </Card>
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
        </div>
    );
}
