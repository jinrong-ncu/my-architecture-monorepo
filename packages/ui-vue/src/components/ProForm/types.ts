import type { FieldRule } from '@arco-design/web-vue';
import type { OSSConfig } from '../ProUpload/hooks/useOSS';

// ==========================================
// 1. 核心表单项的配置类型协议
// ==========================================

/**
 * 单个表单字段的 JSON 配置描述对象
 */
export interface FormItemConfig {
    /**
     * 渲染的组件类型（内置组件名称或外部插槽名）
     * 特殊值 'divider' 表示渲染隔离分组标题带
     */
    component:
    | 'input'
    | 'textarea'
    | 'select'
    | 'cascader'
    | 'date'
    | 'number'
    | 'radio'
    | 'checkbox'
    | 'checkboxGroup'
    | 'switch'
    | 'color'
    | 'rate'
    | 'slider'
    | 'tags'
    | 'divider'
    | 'upload'
    | string; // 其余字符串将被视为具名插槽名称

    /**
     * 绑定的主字段名（对应 formData 的一级 key）
     */
    name: string;

    /**
     * 表单项的标签文字
     */
    label: string;

    /**
     * 占据的栅格数（共 24 栅格），不填则铺满整行
     */
    span?: number;

    /**
     * 表头标签旁的 tooltip 提示内容
     */
    tips?: string;

    /**
     * 组件下方的额外说明文字
     */
    message?: string;

    /**
     * 动态显隐控制：
     * - 布尔值：直接决定是否隐藏
     * - 字符串：以字符串形式编写的 JS 表达式，$ 代表当前 formData
     *   例如 "$.type === '1'" 表示 type 为 '1' 时隐藏此列
     */
    hideHandle?: boolean | string;

    /**
     * 动态必填控制（字符串表达式），$ 代表当前 formData
     * 表达式执行结果为 true 时，此字段变为必填
     */
    requiredHandle?: string;

    /**
     * Arco Design 原生校验规则
     */
    rules?: FieldRule[];

    /**
     * 组件专属的配置（嵌套绑定 / 原生 props / 选项数据）
     */
    options?: {
        /**
         * [嵌套绑定] 当存在时，v-model 绑定到 formData[item.name][item.options.name]
         * 否则默认绑定到 formData[item.name]
         */
        name?: string;

        placeholder?: string;
        disabled?: boolean;
        type?: string;
        maxlength?: number;
        multiple?: boolean;
        clearable?: boolean;
        format?: string;         // date-picker 格式化
        showTime?: boolean;      // date-picker 是否显示时间
        min?: number;            // number / slider 最小值
        max?: number;            // number / slider 最大值
        step?: number;           // slider / number 步长
        allowHalf?: boolean;     // rate 是否允许半星
        count?: number;          // rate 最大值

        /**
         * [upload 专用] 自定义上传函数，传入文件和进度回调，返回包含 url 的对象
         * 与 ossConfig 二选一
         */
        apiObj?: (file: File, onProgress: (p: number) => void) => Promise<any>;

        /**
         * [upload 专用] 云存储 OSS 直传配置，如 Cloudflare R2 / S3
         * 与 apiObj 二选一
         */
        ossConfig?: OSSConfig;

        /**
         * 用于 select / radio / checkbox / cascader 的数据源
         */
        items?: Array<{
            label: string;
            value: any;
            name?: string;
            disabled?: boolean;
            children?: Array<any>; // cascader 子节点
        }>;

        /** 其余透传原生组件的 props */
        [key: string]: any;
    };
}

// ==========================================
// 2. 整体表单配置
// ==========================================

/**
 * ProForm 顶层配置
 */
export interface ProFormConfig {
    /** 标签位置：horizontal | vertical | inline */
    labelPosition?: 'horizontal' | 'vertical' | 'inline';
    /** 是否开启 auto-label-width */
    autoLabelWidth?: boolean;
    /** 标签宽度 */
    labelWidth?: number;
}

// ==========================================
// 3. 组件 Props 定义
// ==========================================

export interface ProFormProps {
    /** v-model 双向绑定的表单数据 */
    modelValue: Record<string, any>;

    /** 字段配置列表 */
    items: FormItemConfig[];

    /** 表单全局配置 */
    config?: ProFormConfig;

    /**
     * 全局只读模式：
     * - true  => 进入“详情查看态”，渲染纯文本，不展示底部操作区
     * - false => 默认编辑态
     */
    readonly?: boolean;
}
