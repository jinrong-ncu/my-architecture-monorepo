<template>
    <div class="modal-demo">
        <h3 style="margin-top: 0; margin-bottom: 24px;">ProModal 高阶弹窗组件压测</h3>

        <a-space wrap :size="16">
            <!-- 弹窗模式 -->
            <a-button type="primary" @click="openModal('modal')">
                <template #icon><icon-plus /></template>
                打开弹窗（Modal）
            </a-button>

            <!-- 抽屉模式 -->
            <a-button @click="openModal('drawer')">
                <template #icon><icon-list /></template>
                打开侧抽屉（Drawer）
            </a-button>

            <!-- 模拟接口失败的弹窗 -->
            <a-button status="danger" @click="openModal('modal', true)">
                <template #icon><icon-close-circle /></template>
                模拟接口失败（弹窗不关闭）
            </a-button>
        </a-space>

        <!-- ==================== 演示说明 ==================== -->
        <a-card style="margin-top: 24px;" title="功能演示说明">
            <a-list :bordered="false">
                <a-list-item>✅ 点击"确定"时，组件自动开启 Loading 并等待 requestApi 异步完成</a-list-item>
                <a-list-item>✅ 接口成功（Promise.resolve）→ 自动关闭弹窗</a-list-item>
                <a-list-item>❌ 接口失败（Promise.reject）→ 弹窗**不关闭**，清除 Loading，让用户修改重试</a-list-item>
                <a-list-item>🔄 同一组件通过 <code>type</code> prop 在 Modal / Drawer 之间切换</a-list-item>
            </a-list>
        </a-card>

        <!-- ======================== ProModal 实例 ======================== -->
        <ProModal v-model:visible="modalVisible" :title="currentTitle" :type="currentType"
            :width="currentType === 'drawer' ? 600 : 560" :request-api="simulateRequest" @ok="handleOk"
            @cancel="handleCancel">
            <!-- 内部包裹 ProForm，展示"弹窗 + 表单"最常见的企业级场景 -->
            <ProForm v-model="formData" :items="formItems"
                :config="{ labelPosition: 'horizontal', autoLabelWidth: true }">
                <!-- ProForm 没有 action 插槽，由 ProModal 底部按钮驱动提交，这里留空 -->
            </ProForm>
        </ProModal>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ProModal, ProForm } from '@rong/ui-vue';
import type { FormItemConfig } from '@rong/ui-vue';

// ==========================================
// 1. 弹窗状态
// ==========================================
const modalVisible = ref(false);
const currentType = ref<'modal' | 'drawer'>('modal');
const currentTitle = ref('新增员工信息');
const shouldFail = ref(false);

// ==========================================
// 2. 嵌套 ProForm 的状态和配置
// ==========================================
const formData = ref<Record<string, any>>({});

const formItems: FormItemConfig[] = [
    {
        component: 'input',
        name: 'name',
        label: '员工姓名',
        span: 12,
        rules: [{ required: true, message: '姓名不能为空' }],
        options: { placeholder: '请输入员工真实姓名' }
    },
    {
        component: 'select',
        name: 'department',
        label: '所属部门',
        span: 12,
        rules: [{ required: true, message: '请选择部门' }],
        options: {
            placeholder: '请选择',
            items: [
                { label: '技术研发', value: 'tech' },
                { label: '产品设计', value: 'product' },
                { label: '运营市场', value: 'marketing' }
            ]
        }
    },
    {
        component: 'radio',
        name: 'gender',
        label: '性别',
        span: 12,
        options: {
            items: [
                { label: '男', value: 'male' },
                { label: '女', value: 'female' }
            ]
        }
    },
    {
        component: 'date',
        name: 'entryDate',
        label: '入职日期',
        span: 12,
        options: { placeholder: '请选择入职日期' }
    },
    {
        component: 'textarea',
        name: 'remark',
        label: '备注',
        span: 24,
        options: { placeholder: '可填写其他补充信息...' }
    }
];

// ==========================================
// 3. 操作方法
// ==========================================

function openModal(type: 'modal' | 'drawer', fail = false) {
    currentType.value = type;
    currentTitle.value = type === 'drawer' ? '侧边抽屉 - 新增员工' : '弹窗 - 新增员工';
    shouldFail.value = fail;
    formData.value = {};   // 每次打开清空表单
    modalVisible.value = true;
}

/**
 * 模拟异步提交接口
 * - shouldFail = true 时：模拟 1.5 秒后接口失败
 * - shouldFail = false 时：模拟 1.5 秒后接口成功
 */
const simulateRequest = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (shouldFail.value) {
                reject(new Error('服务器内部错误，请稍后重试'));
            } else {
                console.log('✅ 提交成功！提交数据：', formData.value);
                resolve();
            }
        }, 1500);
    });
};

function handleOk() {
    console.log('ProModal emit ok，弹窗已自动关闭');
}

function handleCancel() {
    console.log('ProModal emit cancel，用户主动取消');
}
</script>

<style scoped>
.modal-demo {
    width: 100%;
}

code {
    background: var(--color-fill-3);
    padding: 1px 6px;
    border-radius: 3px;
    font-size: 12px;
}
</style>
