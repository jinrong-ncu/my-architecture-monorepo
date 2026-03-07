import type { TableColumnData } from '@arco-design/web-vue/es/table/interface'

/**
 * ProTable 配置化列的核心类型扩展
 */
export interface ProColumnData extends Omit<TableColumnData, 'tooltip'> {
    /**
     * 是否在顶部查询表单中显示该字段作为搜索项
     */
    search?: boolean;

    /**
     * 单元格的数据展现类型
     */
    valueType?: 'text' | 'image' | 'video' | 'date' | 'switch' | 'enum' | 'link' | 'operation' | 'slot' | 'html' | 'array' | 'input' | 'select';

    /**
     * 表头标题旁边的问号提示信息
     */
    tooltip?: string;

    /**
     * 是否在文本旁边展示一键复制图标
     */
    copyable?: boolean;

    /**
     * 日期格式化模板，如 'YYYY-MM-DD'
     * 当 valueType 为 'date' 时生效
     */
    dateFormat?: string;

    /**
     * 开关配置
     * 当 valueType 为 'switch' 时生效
     */
    switchConfig?: {
        activeText?: string;
        inactiveText?: string;
        activeValue?: any;
        inactiveValue?: any;
        disabled?: (row: any) => boolean;
        onChange?: (val: any, row: any) => void;
    };

    /**
     * 枚举类型的字典选项
     * 当 valueType 为 'enum' 或 'select' 时生效
     */
    options?: Array<{ label: string; value: any }>;

    /**
     * 操作列的按钮数组
     * 当 valueType 为 'operation' 时生效
     */
    operation?: Array<{
        label: string;
        icon?: string;
        disabled?: (row: any) => boolean;
        onClick: (record: any) => void;
    }>;

    /**
     * 指定具体的插槽名称
     * 当 valueType 为 'slot' 时生效，替代默认的 bodyCell 插槽标识
     */
    componentSlot?: string;
}

/**
 * 外部传入的主 API 参数签名：(params) => Promise<{ data, total }>
 */
export type ProTableRequestApi = (params: Record<string, any>) => Promise<{
    data: any[];
    total: number;
}>;

/**
 * ProTable 组件接收的核心 Props
 */
export interface ProTableProps {
    /**
     * 数据请求方法，由业务层传入，内部全权接管分页与加载态
     */
    requestApi: ProTableRequestApi;

    /**
     * 表格的列配置，继承于 Arco Design 原生配置并扩展了 search 等属性
     */
    columns: ProColumnData[];

    /**
     * 表格的滚动配置 (如配置项有固定列，建议指定 scroll.x)
     */
    scroll?: {
        x?: number | string;
        y?: number | string;
        minWidth?: number | string;
        maxHeight?: number | string;
    };
}
