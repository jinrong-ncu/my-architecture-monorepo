import { ReactNode } from "react";
import { UseFormReturn } from "react-hook-form";

export interface FormItemOption {
    label: string;
    value: any;
    disabled?: boolean;
}

export interface FormItemConfig {
    name: string;
    label: string;
    placeholder?: string;
    component:
        | 'input'
        | 'textarea'
        | 'select'
        | 'radio'
        | 'checkbox'
        | 'checkboxGroup'
        | 'switch'
        | 'date'
        | 'number'
        | 'divider'
        | string;
    span?: number; // Tailwind grid span (e.g., 1, 2)
    tips?: string;
    rules?: {
        required?: boolean;
        message?: string;
        min?: number;
        max?: number;
        pattern?: RegExp;
    };
    options?: {
        items?: FormItemOption[];
        [key: string]: any;
    };
    hideHandle?: (form: any) => boolean;
    render?: (ctx: { form: UseFormReturn<any>; item: FormItemConfig; readonly: boolean }) => ReactNode;
}

export interface ProFormProps {
    items: FormItemConfig[];
    modelValue: Record<string, any>;
    onUpdateModelValue?: (value: Record<string, any>) => void;
    onSubmit?: (values: Record<string, any>) => void;
    readonly?: boolean;
    title?: string;
    column?: number; // Default grid columns
    className?: string;
}
