import type { FormInstance } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import type { Rule } from 'antd/es/form';
import type { ReactNode } from 'react';

export interface FormItemOption {
    label: string;
    value: any;
    name?: string;
    disabled?: boolean;
    children?: FormItemOption[];
}

export interface FormItemConfig {
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
        | string;
    name: string;
    label: string;
    span?: number;
    tips?: string;
    message?: string;
    hideHandle?: boolean | string;
    requiredHandle?: string;
    rules?: Rule[];
    options?: {
        name?: string;
        placeholder?: string;
        disabled?: boolean;
        type?: string;
        maxlength?: number;
        multiple?: boolean;
        clearable?: boolean;
        format?: string;
        showTime?: boolean;
        min?: number;
        max?: number;
        step?: number;
        allowHalf?: boolean;
        count?: number;
        items?: FormItemOption[];
        [key: string]: any;
    };
    renderFormItem?: (item: FormItemConfig, form: FormInstance, readonly: boolean) => ReactNode;
}

export interface ProFormConfig {
    labelPosition?: 'horizontal' | 'vertical' | 'inline';
    autoLabelWidth?: boolean;
    labelWidth?: number;
}

export interface ProFormProps {
    modelValue: Record<string, any>;
    items: FormItemConfig[];
    config?: ProFormConfig;
    readonly?: boolean;
    onUpdateModelValue?: (value: Record<string, any>) => void;
    onSubmit?: (values: Record<string, any>) => void;
    actionRender?: (ctx: { form: FormInstance; model: Record<string, any> }) => ReactNode;
    renderFormItem?: (item: FormItemConfig, form: FormInstance, readonly: boolean) => ReactNode;
}

export interface ProFormRef {
    form: FormInstance;
    validate: () => Promise<any>;
    resetFields: (fields?: NamePath[]) => void;
    scrollToField: (name: NamePath) => void;
}
