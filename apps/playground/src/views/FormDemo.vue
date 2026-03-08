<template>
    <div class="form-demo">
        <h3 style="margin-top: 0; margin-bottom: 20px;">ProForm 同源渲染：编辑态 / 只读态 对照演示</h3>

        <a-space style="margin-bottom: 16px;">
            <a-button @click="resetDemoData">重置演示数据</a-button>
        </a-space>

        <!-- 当前表单数据快照 -->
        <a-alert type="info" style="margin-bottom: 20px;">
            <template #title>实时数据快照（Deep Binding）</template>
            <pre style="margin: 0; font-size: 12px; white-space: pre-wrap; max-height: 200px; overflow: auto;">{{
                JSON.stringify(formData, null, 2) }}</pre>
        </a-alert>

        <a-row :gutter="16">
            <a-col :span="12">
                <a-card title="编辑态（可交互）" :bordered="true">
                    <ProForm ref="proFormRef" v-model="formData" :items="formItems" :config="formConfig" :readonly="false">

                        <!-- 自定义 slot 插槽演示（component: 'customWidget'） -->
                        <template #customWidget="{ modelRef }">
                            <a-input-tag v-model="modelRef.value" placeholder="回车添加标签" allow-clear />
                        </template>

                        <!-- 操作按钮行：readonly=true 时会被 ProForm 自动隐藏 -->
                        <template #action="{ form }">
                            <a-space style="margin-top: 8px;">
                                <a-button type="primary" @click="handleValidate(form)">
                                    <template #icon><icon-check /></template>
                                    提交并鉴权
                                </a-button>
                                <a-button @click="form.resetFields()">
                                    <template #icon><icon-refresh /></template>
                                    重置
                                </a-button>
                                <a-button status="warning" @click="form.clearValidate()">
                                    清除提示
                                </a-button>
                            </a-space>
                        </template>
                    </ProForm>
                </a-card>
            </a-col>

            <a-col :span="12">
                <a-card title="只读态（同源渲染）" :bordered="true">
                    <ProForm v-model="formData" :items="formItems" :config="formConfig" :readonly="true" />
                </a-card>
            </a-col>
        </a-row>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ProForm } from 'rongshiyi-ui-vue';
import { FormItemConfig, ProFormConfig, createS3Uploader } from 'rongshiyi-ui-vue';
const realUploadApi = createS3Uploader();

const makeDemoFormData = () => ({
    customerType: 'person',
    name: '张三',
    idType: 'id_card',
    enterpriseName: '',
    userInfo: {
        phone: '13800138000',
        email: 'zhangsan@example.com'
    },
    birthday: '1993-07-16',
    age: 32,
    satisfaction: 4.5,
    progress: 80,
    interests: ['vue3', 'nodejs', 'go'],
    themeColor: '#165DFF',
    receiveNotify: true,
    keywords: ['中后台', 'ProForm', 'Schema'],
    avatar: [
        { name: 'avatar.png', url: 'https://cdn.example.com/uploads/avatar.png' },
        'https://cdn.example.com/uploads/id-card-front.jpg'
    ],
    customTags: ['可配置', '可扩展']
});

// ==========================================
// 1. 状态定义
// ==========================================
const formData = ref<Record<string, any>>(makeDemoFormData());
const proFormRef = ref();

// ==========================================
// 2. 全局表单配置
// ==========================================
const formConfig: ProFormConfig = {
    labelPosition: 'horizontal',
    autoLabelWidth: true
};

// ==========================================
// 3. 全字段配置 Schema（覆盖所有 component 类型）
// ==========================================
const formItems: FormItemConfig[] = [

    // --- 分组一：基本信息 ---
    {
        component: 'divider',
        name: '_divider_1',
        label: '客户基础信息',
        tips: '以下字段为核心录入字段，带 * 号为动态必填逻辑约束'
    },
    {
        component: 'radio',
        name: 'customerType',
        label: '客户类型',
        span: 24,
        options: {
            items: [
                { label: '个人用户', value: 'person' },
                { label: '企业用户', value: 'enterprise' }
            ]
        }
    },
    {
        component: 'input',
        name: 'name',
        label: '真实姓名',
        span: 12,
        tips: '请填写身份证上的法定姓名',
        // 当 customerType 为 enterprise 时，隐藏该字段（$ 代表 formData）
        hideHandle: "$.customerType === 'enterprise'",
        // 当 customerType 为 person 时，动态必填
        requiredHandle: "$.customerType === 'person'",
        rules: [{ required: false, message: '姓名不能为空' }],
        options: { placeholder: '请输入真实姓名', maxlength: 30 }
    },
    {
        component: 'select',
        name: 'idType',
        label: '证件类型',
        span: 12,
        hideHandle: "$.customerType === 'enterprise'",
        options: {
            placeholder: '请选择证件类型',
            items: [
                { label: '居民身份证', value: 'id_card' },
                { label: '护照', value: 'passport' },
                { label: '港澳通行证', value: 'hk_macao' }
            ]
        }
    },
    {
        component: 'input',
        name: 'enterpriseName',
        label: '企业全称',
        span: 24,
        hideHandle: "$.customerType !== 'enterprise'",
        requiredHandle: "$.customerType === 'enterprise'",
        rules: [{ required: false, message: '企业名称不能为空' }],
        options: { placeholder: '请输入工商注册企业全称' }
    },
    // --- 嵌套绑定示范 (formData.userInfo.phone) ---
    {
        component: 'input',
        name: 'userInfo',
        label: '手机号码',
        span: 12,
        message: '该字段绑定到 formData.userInfo.phone（嵌套绑定演示）',
        options: {
            name: 'phone',
            placeholder: '请输入手机号',
            maxlength: 11,
            type: 'text'
        }
    },
    {
        component: 'input',
        name: 'userInfo',
        label: '邮箱地址',
        span: 12,
        options: {
            name: 'email',
            placeholder: '请输入邮箱地址'
        }
    },

    // --- 分组二：时间与评分 ---
    {
        component: 'divider',
        name: '_divider_2',
        label: '时间与评分'
    },
    {
        component: 'date',
        name: 'birthday',
        label: '出生日期',
        span: 12,
        options: { placeholder: '请选择出生日期', format: 'YYYY-MM-DD' }
    },
    {
        component: 'number',
        name: 'age',
        label: '年龄',
        span: 12,
        options: { min: 0, max: 150, step: 1, placeholder: '请输入年龄' }
    },
    {
        component: 'rate',
        name: 'satisfaction',
        label: '满意度',
        span: 12,
        tips: '请对我们的服务进行评价',
        options: { count: 5, allowHalf: true }
    },
    {
        component: 'slider',
        name: 'progress',
        label: '进度百分比',
        span: 12,
        options: { min: 0, max: 100, step: 5 }
    },

    // --- 分组三：多选与开关 ---
    {
        component: 'divider',
        name: '_divider_3',
        label: '偏好与开关配置'
    },
    {
        component: 'checkboxGroup',
        name: 'interests',
        label: '技术兴趣',
        span: 24,
        options: {
            items: [
                { label: 'Vue3', value: 'vue3' },
                { label: 'React', value: 'react' },
                { label: 'Node.js', value: 'nodejs' },
                { label: 'Rust', value: 'rust' },
                { label: 'Go', value: 'go' }
            ]
        }
    },
    {
        component: 'color',
        name: 'themeColor',
        label: '主题色',
        span: 12,
        tips: '选择您偏好的界面主题颜色'
    },
    {
        component: 'switch',
        name: 'receiveNotify',
        label: '接收通知',
        span: 12
    },

    // --- 分组四：标签与上传 ---
    {
        component: 'divider',
        name: '_divider_4',
        label: '标签输入与文件上传'
    },
    {
        component: 'tags',
        name: 'keywords',
        label: '关键词标签',
        span: 24,
        message: '按 Enter 或失焦确认添加标签，点击 × 删除'
    },
    {
        component: 'upload',
        name: 'avatar',
        label: '头像上传',
        span: 24,
        options: {
            listType: 'picture-card', limit: 1, accept: 'image/*', tip: '仅支持图片格式',
            apiObj: realUploadApi,   // ← 直接传 createS3Uploader() 的返回值
            maxSize: 115,
            title: '点击上传头像',
            icon: 'icon-camera',
        }
    },

    // --- 分组五：自定义插槽 ---
    {
        component: 'divider',
        name: '_divider_5',
        label: '自定义插槽 (slot)'
    },
    {
        component: 'customWidget',  // 匹配模板中 #customWidget 插槽
        name: 'customTags',
        label: '自定义标签组',
        span: 24,
        message: '这是一个完全由业务层插槽自定义的控件，组件库只提供数据绑定'
    }
];

// ==========================================
// 4. 交互回调
// ==========================================
const handleValidate = async (formInstance: any) => {
    const errors = await formInstance.validate();
    if (errors) {
        console.warn('【校验失败】', errors);
        return;
    }
    console.log('【校验通过】payload:', formData.value);
};

const resetDemoData = () => {
    formData.value = makeDemoFormData();
};
</script>

<style scoped>
.form-demo {
    width: 100%;
}

pre {
    line-height: 1.6;
}
</style>
