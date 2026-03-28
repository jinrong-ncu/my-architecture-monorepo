import type { Component } from 'vue';

export interface ProTableRequestParams {
    page: number;
    pageSize: number;
    [key: string]: any;
}

export interface ProTableResponse<T = any> {
    data: T[];
    total: number;
}

export type ProValueType =
    | 'text'
    | 'select'
    | 'date'
    | 'image'
    | 'video'
    | 'html'
    | 'switch'
    | 'enum'
    | 'array'
    | 'link'
    | 'slot'
    | 'operation';

export interface ProOperationAction<T = any> {
    label: string;
    icon?: Component;
    onClick: (record: T) => void;
    disabled?: (record: T) => boolean;
}

export interface ProColumnData<T = any> {
    title: string;
    dataIndex?: string;
    width?: number | string;
    align?: 'left' | 'center' | 'right';
    fixed?: 'left' | 'right'; // Not perfectly mapped in shadcn default Table without custom flex/sticky
    search?: boolean;
    tooltip?: string;

    valueType?: ProValueType;
    copyable?: boolean;
    slotName?: string;
    componentSlot?: string;

    dateFormat?: string;

    options?: Array<{ label: string; value: string | number; disabled?: boolean }>;
    
    // Switch specific config
    switchConfig?: {
        activeText?: string;
        inactiveText?: string;
        activeValue?: any;
        inactiveValue?: any;
        disabled?: (record: T) => boolean;
        onChange?: (val: any, record: T) => void;
    };

    operation?: ProOperationAction<T>[];
}

export interface ProTableProps {
    columns: ProColumnData[];
    requestApi?: (params: ProTableRequestParams) => Promise<ProTableResponse> | ProTableResponse;
    showSetting?: boolean;
    cacheKey?: string;
    scroll?: { x?: string | number; y?: string | number };
}
