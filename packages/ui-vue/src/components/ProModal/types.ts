/**
 * ProModal 弹窗组件的核心 Props 协议
 */
export interface ProModalProps {
    /**
     * 弹窗是否可见（支持 v-model:visible 双向绑定）
     */
    visible: boolean;

    /**
     * 弹窗标题
     */
    title?: string;

    /**
     * 渲染形态：弹窗 or 侧抽屉（默认 modal）
     */
    type?: 'modal' | 'drawer';

    /**
     * 弹窗/抽屉的宽度
     */
    width?: number | string;

    /**
     * 确定按钮的文案（默认"确 定"）
     */
    okText?: string;

    /**
     * 取消按钮的文案（默认"取 消"）
     */
    cancelText?: string;

    /**
     * 异步提交函数（核心能力）
     *
     * 当用户点击确定时触发。组件内部会：
     * 1. 自动开启 confirmLoading 状态
     * 2. 等待该 Promise 执行结果
     * 3. resolve → 自动关闭弹窗并清除 loading
     * 4. reject  → 不关闭弹窗，仅清除 loading（让用户可修改后重试）
     */
    requestApi?: () => Promise<any>;

    /**
     * 传给底层 <a-drawer> 的其他原生 Props
     */
    drawerProps?: Record<string, any>;

    /**
     * 传给底层 <a-modal> 的其他原生 Props
     */
    modalProps?: Record<string, any>;
}
