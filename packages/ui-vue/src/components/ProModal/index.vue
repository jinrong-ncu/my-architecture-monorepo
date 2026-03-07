<template>
    <!-- 
        动态形态引擎：根据 type prop 切换渲染模式
        - modal  → Arco <a-modal>  (居中遮罩弹窗)
        - drawer → Arco <a-drawer> (侧滑抽屉)
    -->

    <!-- ① 弹窗模式 -->
    <a-modal v-if="type !== 'drawer'" v-bind="modalProps" :visible="innerVisible" :title="title" :width="width"
        :ok-text="okText || '确 定'" :cancel-text="cancelText || '取 消'" :ok-loading="confirmLoading"
        :mask-closable="false" @ok="handleOk" @cancel="handleCancel" @close="handleCancel">
        <!-- 默认插槽：放置 ProForm 或任意业务内容 -->
        <slot />

        <!-- 自定义底部 footer 插槽 -->
        <template v-if="$slots.footer" #footer>
            <slot name="footer" :loading="confirmLoading" :close="handleCancel" />
        </template>
    </a-modal>

    <!-- ② 抽屉模式 -->
    <a-drawer v-else v-bind="drawerProps" :visible="innerVisible" :title="title" :width="width"
        :ok-text="okText || '确 定'" :cancel-text="cancelText || '取 消'" :ok-loading="confirmLoading"
        :mask-closable="false" @ok="handleOk" @cancel="handleCancel" @close="handleCancel">
        <!-- 默认插槽 -->
        <slot />

        <!-- 自定义底部 footer 插槽 -->
        <template v-if="$slots.footer" #footer>
            <slot name="footer" :loading="confirmLoading" :close="handleCancel" />
        </template>
    </a-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { ProModalProps } from './types';

// ==========================================
// 1. Props & Emits 声明
// ==========================================
const props = withDefaults(defineProps<ProModalProps>(), {
    type: 'modal',
    width: 520,
    okText: '确 定',
    cancelText: '取 消'
});

const emit = defineEmits<{
    'update:visible': [val: boolean];  // v-model:visible 双向绑定
    'ok': [];                          // 提交成功后触发
    'cancel': [];                      // 取消/关闭触发
}>();

// ==========================================
// 2. 内部状态
// ==========================================

/**
 * 内部维护的可见状态镜像
 * 不直接修改 props.visible，而是通过 emit 通知外部
 */
const innerVisible = ref(props.visible);

/**
 * 确定按钮的 Loading 状态
 * 由内部接管，外部无需关注
 */
const confirmLoading = ref(false);

// ==========================================
// 3. 状态同步：外部 visible 变化 → 内部同步
// ==========================================
watch(() => props.visible, (val) => {
    innerVisible.value = val;
});

// ==========================================
// 4. 核心：异步提交拦截
// ==========================================

/**
 * 用户点击"确定"时触发的异步拦截器
 *
 * 生命周期：
 * 1. 启动 confirmLoading → 阻止重复点击
 * 2. 执行 requestApi（外部注入的异步函数）
 * 3. Promise.resolve → 请求成功，关闭弹窗
 * 4. Promise.reject  → 请求失败，保留弹窗让用户修改重试，仅清除 loading
 */
async function handleOk() {
    // 没有传入 requestApi 时，直接关闭
    if (!props.requestApi) {
        emit('ok');
        closeModal();
        return;
    }

    confirmLoading.value = true;
    try {
        await props.requestApi();
        // ✅ 请求成功 → 关闭弹窗并上报 ok 事件
        emit('ok');
        closeModal();
    } catch (err) {
        // ❌ 请求失败 → 不关闭弹窗，仅关闭 loading，让用户修改后重试
        console.warn('[ProModal] requestApi 执行失败，弹窗保持打开：', err);
    } finally {
        confirmLoading.value = false;
    }
}

/**
 * 用户点击取消/蒙层/X 按钮时的统一处理
 */
function handleCancel() {
    emit('cancel');
    closeModal();
}

/**
 * 关闭弹窗：通知外层修改 v-model:visible
 */
function closeModal() {
    innerVisible.value = false;
    emit('update:visible', false);
}

// ==========================================
// 5. 对外暴漏关闭方法（供父组件通过 ref 主动关闭）
// ==========================================
defineExpose({
    close: closeModal
});
</script>
