export type ProTableFormComponentType = 'input' | 'select' | 'radio' | 'date' | 'custom' | string;

export interface ProTableFormOption {
    label: string;
    value: any;
    disabled?: boolean;
}

export interface ProTableFormRule {
    required?: boolean;
    message?: string;
    validator?: (value: any, row: Record<string, any>) => boolean | string;
}

export interface ProTableFormColumn {
    title: string;
    dataIndex: string;
    width?: number | string;
    align?: 'left' | 'center' | 'right';
    component?: ProTableFormComponentType;
    options?: ProTableFormOption[];
    props?: Record<string, any>;
    rules?: ProTableFormRule[];
    readonly?: boolean;
}

export interface ProTableFormProps {
    modelValue: Record<string, any>[];
    columns: ProTableFormColumn[];
    rowKeyField?: string;
    showAction?: boolean;
    actionTitle?: string;
    actionWidth?: number;
    addDefaultRow?: Record<string, any>;
}

export interface ProTableFormExpose {
    validate: () => Promise<boolean>;
    addItem: (row?: Record<string, any>) => void;
    removeItem: (rowKey: string) => void;
}
