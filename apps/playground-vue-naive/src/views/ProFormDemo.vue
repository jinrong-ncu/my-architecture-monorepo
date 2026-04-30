<template>
    <div class="pro-form-demo">
        <n-card title="ProForm 演示沙盒 (Naive UI版)">
            <template #header-extra>
                <n-space>
                    <n-switch v-model:value="isReadonly">
                        <template #checked>详情态 (只读)</template>
                        <template #unchecked>编辑态</template>
                    </n-switch>
                </n-space>
            </template>

                <ProForm
                    ref="proFormRef"
                    v-model="formData"
                    :items="formItems"
                    :config="formConfig"
                    :readonly="isReadonly"
                >
                    <!-- 自定义插槽示例 -->
                    <template #customSlot="{ modelRef }">
                        <n-input-group>
                            <n-input v-model:value="modelRef.value" placeholder="这是自定义插槽渲染的" />
                            <n-button type="primary">验证</n-button>
                        </n-input-group>
                    </template>

                    <!-- 行动区插槽 -->
                    <template #action="{ form }">
                        <n-space>
                            <n-button type="primary" @click="handleSubmit">
                                提交表单
                            </n-button>
                            <n-button @click="handleReset">重置</n-button>
                            <n-button @click="logData">打印数据</n-button>
                        </n-space>
                    </template>
                </ProForm>
            
            <n-divider />
            
            <div class="debug-data">
                <h3>当前表单数据 (v-model绑定):</h3>
                <pre>{{ JSON.stringify(formData, null, 2) }}</pre>
            </div>
        </n-card>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { NCard, NSpace, NSwitch, NInputGroup, NInput, NButton, NDivider, useMessage } from 'naive-ui';
// 使用相对路径引用刚刚开发的组件，因为包可能尚未在 pnpm 中初始化完成
import { ProForm } from '../../../../packages/ui-vue-naive/src/components/ProForm';
import type { FormItemConfig, ProFormConfig } from '../../../../packages/ui-vue-naive/src/components/ProForm';

const message = useMessage();
const proFormRef = ref();

const isReadonly = ref(false);

const formData = ref({
    userInfo: {
        username: '张三',
        age: 28,
    },
    contact: {
        email: '',
    },
    hobby: ['reading'],
    hasCar: true,
    carBrand: null,
});

const formConfig: ProFormConfig = {
    labelPlacement: 'left',
    labelAlign: 'right',
    labelWidth: 120,
    xGap: 24,
    yGap: 16
};

const formItems: FormItemConfig[] = [
    {
        component: 'divider',
        name: 'd1',
        label: '基础信息',
        tips: '这是分组提示信息'
    },
    {
        component: 'input',
        name: 'userInfo',
        label: '用户名',
        span: 12,
        options: {
            name: 'username',
            placeholder: '请输入用户名'
        },
        rules: { required: true, message: '用户名不能为空', trigger: ['blur', 'input'] }
    },
    {
        component: 'number',
        name: 'userInfo',
        label: '年龄',
        span: 12,
        options: {
            name: 'age',
            min: 1,
            max: 120
        }
    },
    {
        component: 'select',
        name: 'city',
        label: '所在城市',
        span: 12,
        options: {
            items: [
                { label: '北京', value: 'beijing' },
                { label: '上海', value: 'shanghai' },
                { label: '广州', value: 'guangzhou' },
                { label: '深圳', value: 'shenzhen' },
            ]
        },
        rules: { required: true, message: '请选择城市' }
    },
    {
        component: 'date',
        name: 'joinDate',
        label: '入职日期',
        span: 12,
    },
    {
        component: 'divider',
        name: 'd2',
        label: '动态联动测试'
    },
    {
        component: 'switch',
        name: 'hasCar',
        label: '是否有车',
        span: 24,
        message: '切换开关，下方输入框会动态显隐'
    },
    {
        component: 'input',
        name: 'carBrand',
        label: '汽车品牌',
        span: 12,
        // 动态显隐：hasCar 为 true 时显示，false 时隐藏
        hideHandle: '!$.hasCar',
        // 动态必填：显示时必填
        requiredHandle: '$.hasCar'
    },
    {
        component: 'divider',
        name: 'd3',
        label: '其他组件测试'
    },
    {
        component: 'checkboxGroup',
        name: 'hobby',
        label: '兴趣爱好',
        span: 24,
        options: {
            items: [
                { label: '阅读', value: 'reading' },
                { label: '旅游', value: 'travel' },
                { label: '游戏', value: 'gaming' },
            ]
        }
    },
    {
        component: 'slider',
        name: 'score',
        label: '自我评分',
        span: 12,
        options: {
            min: 0,
            max: 100,
            step: 5
        }
    },
    {
        component: 'rate',
        name: 'rating',
        label: '星级评定',
        span: 12,
    },
    {
        component: 'tags',
        name: 'tags',
        label: '个人标签',
        span: 24,
    },
    {
        component: 'customSlot', // 将命中具名插槽
        name: 'customField',
        label: '自定义插槽',
        span: 24,
    }
];

const handleSubmit = async () => {
    try {
        await proFormRef.value?.validate();
        message.success('校验通过！正在提交数据');
        console.log('提交的数据：', JSON.parse(JSON.stringify(formData.value)));
    } catch (errors) {
        message.error('表单校验未通过，请检查必填项');
        console.error('校验错误：', errors);
    }
};

const handleReset = () => {
    proFormRef.value?.restoreValidation();
    // 实际项目中可重置 formData 对象
};

const logData = () => {
    console.log(JSON.parse(JSON.stringify(formData.value)));
};
</script>

<style scoped>
.pro-form-demo {
    padding: 24px;
    max-width: 1000px;
    margin: 0 auto;
}
.debug-data {
    margin-top: 20px;
    background: #f5f5f5;
    padding: 16px;
    border-radius: 4px;
}
</style>
