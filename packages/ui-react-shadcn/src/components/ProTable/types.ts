import { ReactNode } from "react";

/**
 * ProTable 配置化列的核心类型
 */
export interface ProColumnType<T = any> {
    title: string;
    dataIndex: string;
    key?: string;
    width?: string | number;
    align?: 'left' | 'center' | 'right';
    
    /**
     * 是否在顶部查询表单中显示该字段作为搜索项
     */
    search?: boolean;

    /**
     * 单元格的数据展现类型
     */
    valueType?: 'text' | 'image' | 'video' | 'date' | 'switch' | 'enum' | 'link' | 'operation' | 'slot' | 'html' | 'array' | 'select';

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
     */
    dateFormat?: string;

    /**
     * 开关配置
     */
    switchConfig?: {
        activeText?: string;
        inactiveText?: string;
        activeValue?: any;
        inactiveValue?: any;
        disabled?: (row: T) => boolean;
        onChange?: (val: any, row: T) => void;
    };

    /**
     * 枚举或下拉字典选项
     */
    options?: Array<{ label: string; value: any }>;

    /**
     * 操作列的按钮数组
     */
    operation?: Array<{
        label: string;
        icon?: ReactNode;
        disabled?: (row: T) => boolean;
        onClick: (record: T) => void;
    }>;

    /**
     * 隐藏列
     */
    hideInTable?: boolean;

    /**
     * 自定义渲染
     */
    render?: (text: any, record: T, index: number) => ReactNode;
}

/**
 * 数据请求接口
 */
export type ProTableRequestApi<T = any> = (params: {
    page: number;
    pageSize: number;
    [key: string]: any;
}) => Promise<{
    data: T[];
    total: number;
}>;

/**
 * ProTable Props
 */
export interface ProTableProps<T = any> {
    columns: ProColumnType<T>[];
    requestApi?: ProTableRequestApi<T>;
    rowKey?: string | ((record: T) => string);
    headerTitle?: ReactNode;
    toolBarRender?: () => ReactNode[];
    showSetting?: boolean;
    cacheKey?: string;
    className?: string;
}
