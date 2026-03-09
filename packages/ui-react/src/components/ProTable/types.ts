import type { TableProps } from 'antd';
import type { ColumnType } from 'antd/es/table';
import type { ReactNode } from 'react';

/**
 * ProTable 配置化列的核心类型扩展
 */
export interface ProColumnType<RecordType = any> extends Omit<ColumnType<RecordType>, 'tooltip'> {
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
    tooltip?: ReactNode;

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
        disabled?: (row: RecordType) => boolean;
        onChange?: (val: any, row: RecordType) => void;
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
        icon?: ReactNode;
        disabled?: (row: RecordType) => boolean;
        onClick: (record: RecordType) => void;
    }>;

    /**
     * 控制列显隐（Vue 版本无此显式属性，但在设置面板可控制，提供为快捷隐藏属性）
     */
    hideInTable?: boolean;

    /**
     * 替代 Vue 版本 slot，用 React 的 render 渲染函数处理复杂列
     */
    renderSlot?: (text: any, record: RecordType, index: number) => ReactNode;
}

/**
 * 外部传入的主 API 参数签名
 */
export type ProTableRequestApi<RecordType = any> = (params: Record<string, any>) => Promise<{
    data: RecordType[];
    total: number;
    success?: boolean; // 兼容原来的定义
}>;

/**
 * ProTable 组件接收的核心 Props
 */
export interface ProTableProps<RecordType = any> extends Omit<TableProps<RecordType>, 'columns' | 'dataSource' | 'pagination'> {
    /**
     * 数据请求方法，由业务层传入，内部全权接管分页与加载态
     */
    requestApi?: ProTableRequestApi<RecordType>;

    /**
     * 兼容老的 request
     */
    request?: ProTableRequestApi<RecordType>;

    /**
     * 表格的列配置，继承于 Antd 原生配置并扩展了 search 等属性
     */
    columns: ProColumnType<RecordType>[];

    /**
     * 列配置缓存的唯一标识
     * 用于 localStorage key 拼接
     */
    cacheKey?: string;

    /**
     * 是否显示列设置功能（默认 true）
     */
    showSetting?: boolean;

    /**
     * 表格左上角的标题
     */
    headerTitle?: ReactNode;

    /**
     * 表格右上角的操作区
     */
    toolBarRender?: () => ReactNode[];
}
