import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import {
    Button,
    Cascader,
    Checkbox,
    Col,
    DatePicker,
    Divider,
    Form,
    Input,
    InputNumber,
    Radio,
    Rate,
    Row,
    Select,
    Slider,
    Space,
    Switch,
    Tooltip,
} from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import type { FormItemConfig, FormItemOption, ProFormProps, ProFormRef } from './types';
import './index.css';

function deepMerge(dst: Record<string, any>, src: Record<string, any>) {
    Object.keys(src || {}).forEach((key) => {
        const srcValue = src[key];
        if (srcValue !== null && typeof srcValue === 'object' && !Array.isArray(srcValue)) {
            if (!dst[key] || typeof dst[key] !== 'object' || Array.isArray(dst[key])) {
                dst[key] = {};
            }
            deepMerge(dst[key], srcValue);
        } else {
            dst[key] = srcValue;
        }
    });
}

function evaluateExpression(expression: string, formData: Record<string, any>) {
    const fn = new Function('form', `return (${expression.replace(/\$/g, 'form')})`);
    return fn(formData);
}

function isEmptyValue(value: unknown): boolean {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
}

function isSameValue(left: unknown, right: unknown): boolean {
    return left === right || String(left) === String(right);
}

function findLabelByValue(options: FormItemOption[] = [], targetValue: unknown): string | undefined {
    const matched = options.find((option) => isSameValue(option.value, targetValue));
    return matched?.label;
}

function formatDateText(value: unknown, format = 'YYYY-MM-DD'): string {
    if (value && typeof value === 'object' && 'format' in (value as Record<string, any>)) {
        const dayjsLike = value as { format: (fmt?: string) => string };
        const text = dayjsLike.format?.(format);
        return text?.trim() ? text : '-';
    }

    const date = value instanceof Date ? value : new Date(value as any);
    if (Number.isNaN(date.getTime())) return String(value ?? '-');

    const tokenMap: Record<string, string> = {
        YYYY: String(date.getFullYear()),
        MM: String(date.getMonth() + 1).padStart(2, '0'),
        DD: String(date.getDate()).padStart(2, '0'),
        HH: String(date.getHours()).padStart(2, '0'),
        mm: String(date.getMinutes()).padStart(2, '0'),
        ss: String(date.getSeconds()).padStart(2, '0'),
    };

    return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (token) => tokenMap[token]);
}

function getCascaderPathLabel(options: FormItemOption[] = [], pathValues: unknown): string {
    if (!Array.isArray(pathValues) || pathValues.length === 0) return '-';

    const labels: string[] = [];
    let currentOptions = options;

    for (const value of pathValues) {
        const matched = currentOptions.find((option) => isSameValue(option.value, value));
        if (!matched) return '-';
        labels.push(matched.label);
        currentOptions = Array.isArray(matched.children) ? matched.children : [];
    }

    return labels.length > 0 ? labels.join(' / ') : '-';
}

function toDisplayText(value: unknown): string {
    if (Array.isArray(value)) return value.map((item) => String(item)).join('、');
    return String(value);
}

function renderReadonlyText(item: FormItemConfig, rawValue: unknown): string {
    if (isEmptyValue(rawValue)) return '-';

    const component = item.component;
    const options = item.options?.items || [];

    if (component === 'select' || component === 'radio' || component === 'checkboxGroup') {
        if (Array.isArray(rawValue)) {
            const labels = rawValue
                .map((value) => findLabelByValue(options, value))
                .filter((label): label is string => !!label && label.trim().length > 0);
            return labels.length > 0 ? labels.join('、') : '-';
        }
        const label = findLabelByValue(options, rawValue);
        return label?.trim() ? label : '-';
    }

    if (component === 'cascader') {
        if (!Array.isArray(rawValue)) return '-';
        if (rawValue.length > 0 && Array.isArray(rawValue[0])) {
            const pathTexts = (rawValue as unknown[])
                .map((path) => getCascaderPathLabel(options, path))
                .filter((text) => text !== '-');
            return pathTexts.length > 0 ? pathTexts.join('；') : '-';
        }
        return getCascaderPathLabel(options, rawValue);
    }

    if (component === 'date') {
        if (Array.isArray(rawValue)) {
            const texts = rawValue
                .map((value) => formatDateText(value, item.options?.format || 'YYYY-MM-DD'))
                .filter((text) => text !== '-');
            return texts.length > 0 ? texts.join(' ~ ') : '-';
        }
        return formatDateText(rawValue, item.options?.format || 'YYYY-MM-DD');
    }

    if (component === 'checkbox') {
        return rawValue ? '是' : '否';
    }

    if (component === 'switch') {
        return rawValue ? '开启' : '关闭';
    }

    const text = toDisplayText(rawValue);
    return text.trim() ? text : '-';
}

function getPropName(item: FormItemConfig) {
    if (item.options?.name) return [item.name, item.options.name];
    return item.name;
}

function getValueByPath(data: Record<string, any>, path: string | string[]) {
    if (Array.isArray(path)) {
        return path.reduce((result, key) => result?.[key], data as any);
    }
    return data[path];
}

function checkHide(item: FormItemConfig, formData: Record<string, any>): boolean {
    if (item.hideHandle === undefined || item.hideHandle === null) return false;
    if (typeof item.hideHandle === 'boolean') return item.hideHandle;
    try {
        return !!evaluateExpression(item.hideHandle, formData);
    } catch (error) {
        console.warn('[ProForm] hideHandle 解析失败:', item.hideHandle, error);
        return false;
    }
}

function getRules(item: FormItemConfig, formData: Record<string, any>) {
    const rules = item.rules ? [...item.rules] : [];
    if (!item.requiredHandle) return rules;

    try {
        const isRequired = !!evaluateExpression(item.requiredHandle, formData);
        const requiredRule = rules.find((rule: any) => Object.prototype.hasOwnProperty.call(rule, 'required')) as any;
        if (requiredRule) {
            requiredRule.required = isRequired;
        } else if (isRequired) {
            rules.unshift({ required: true, message: `${item.label}不能为空` });
        }
    } catch (error) {
        console.warn('[ProForm] requiredHandle 解析失败:', item.requiredHandle, error);
    }

    return rules;
}

function renderComponent(item: FormItemConfig, readonly: boolean, formData: Record<string, any>) {
    if (readonly) {
        return <div className="rongshiyi-pro-form__readonly-text">{renderReadonlyText(item, getValueByPath(formData, getPropName(item) as any))}</div>;
    }

    const commonProps = {
        placeholder: item.options?.placeholder,
        disabled: item.options?.disabled,
    };

    switch (item.component) {
        case 'input':
            return <Input {...commonProps} maxLength={item.options?.maxlength} type={item.options?.type} allowClear />;
        case 'textarea':
            return <Input.TextArea {...commonProps} maxLength={item.options?.maxlength} autoSize={{ minRows: 3, maxRows: 6 }} allowClear />;
        case 'select':
            return (
                <Select
                    {...commonProps}
                    mode={item.options?.multiple ? 'multiple' : undefined}
                    options={item.options?.items}
                    allowClear={item.options?.clearable !== false}
                />
            );
        case 'cascader':
            return (
                <Cascader
                    {...commonProps}
                    options={item.options?.items || []}
                    multiple={item.options?.multiple}
                    allowClear={item.options?.clearable !== false}
                />
            );
        case 'radio':
            return (
                <Radio.Group
                    options={(item.options?.items || []).map((opt) => ({
                        label: opt.label,
                        value: opt.value,
                        disabled: opt.disabled,
                    }))}
                />
            );
        case 'checkbox':
            return <Checkbox>{item.options?.placeholder || item.label}</Checkbox>;
        case 'checkboxGroup':
            return (
                <Checkbox.Group
                    options={(item.options?.items || []).map((opt) => ({
                        label: opt.label,
                        value: opt.value,
                        disabled: opt.disabled,
                    }))}
                />
            );
        case 'date':
            return <DatePicker className="rongshiyi-pro-form__full-width" format={item.options?.format || 'YYYY-MM-DD'} showTime={item.options?.showTime} allowClear />;
        case 'number':
            return <InputNumber {...commonProps} min={item.options?.min} max={item.options?.max} step={item.options?.step} className="rongshiyi-pro-form__full-width" />;
        case 'switch':
            return <Switch disabled={item.options?.disabled} />;
        case 'rate':
            return <Rate count={item.options?.count} allowHalf={item.options?.allowHalf} disabled={item.options?.disabled} />;
        case 'slider':
            return <Slider min={item.options?.min} max={item.options?.max} step={item.options?.step} disabled={item.options?.disabled} />;
        case 'tags':
            return <Select mode="tags" placeholder={item.options?.placeholder} disabled={item.options?.disabled} allowClear />;
        default:
            return null;
    }
}

export const ProForm = forwardRef<ProFormRef, ProFormProps>((props, ref) => {
    const {
        modelValue,
        items,
        config,
        readonly = false,
        onUpdateModelValue,
        onSubmit,
        actionRender,
        renderFormItem,
    } = props;

    const [form] = Form.useForm();
    const [formData, setFormData] = useState<Record<string, any>>({});

    useEffect(() => {
        const merged: Record<string, any> = {};
        deepMerge(merged, modelValue || {});
        items.forEach((item) => {
            if (item.name && item.options?.name && !merged[item.name]) {
                merged[item.name] = {};
            }
        });
        setFormData(merged);
        form.setFieldsValue(merged);
    }, [form, items, modelValue]);

    const visibleItems = useMemo(() => items.filter((item) => !checkHide(item, formData)), [items, formData]);

    useImperativeHandle(ref, () => ({
        form,
        validate: () => form.validateFields(),
        resetFields: (fields) => form.resetFields(fields as any),
        scrollToField: (name) => form.scrollToField(name),
    }), [form]);

    const handleValuesChange = (_changedValues: any, allValues: Record<string, any>) => {
        setFormData(allValues);
        onUpdateModelValue?.(allValues);
    };

    const handleFinish = (values: Record<string, any>) => {
        onSubmit?.(values);
    };

    const labelCol = config?.labelPosition === 'horizontal' && config?.labelWidth
        ? { style: { width: config.labelWidth } }
        : undefined;

    return (
        <div className="rongshiyi-pro-form">
            <Form
                form={form}
                layout={config?.labelPosition || 'horizontal'}
                labelAlign="left"
                labelCol={labelCol}
                onValuesChange={handleValuesChange}
                onFinish={handleFinish}
            >
                <Row gutter={15}>
                    {visibleItems.map((item) => {
                        const key = `${item.name}_${item.options?.name || ''}_${item.component}`;

                        if (item.component === 'divider') {
                            return (
                                <Col span={24} key={key}>
                                    <div className="rongshiyi-pro-form__divider">
                                        <span className="rongshiyi-pro-form__divider-title">{item.label}</span>
                                        {item.tips ? (
                                            <Tooltip title={item.tips}>
                                                <QuestionCircleOutlined className="rongshiyi-pro-form__divider-icon" />
                                            </Tooltip>
                                        ) : null}
                                        <Divider className="rongshiyi-pro-form__divider-line" />
                                    </div>
                                </Col>
                            );
                        }

                        return (
                            <Col span={item.span || 24} key={key}>
                                <Form.Item
                                    name={getPropName(item)}
                                    label={
                                        <Space size={4}>
                                            <span>{item.label}</span>
                                            {item.tips ? (
                                                <Tooltip title={item.tips}>
                                                    <QuestionCircleOutlined className="rongshiyi-pro-form__label-icon" />
                                                </Tooltip>
                                            ) : null}
                                        </Space>
                                    }
                                    rules={getRules(item, formData)}
                                    valuePropName={item.component === 'switch' || item.component === 'checkbox' ? 'checked' : 'value'}
                                >
                                    {item.renderFormItem
                                        ? item.renderFormItem(item, form, readonly)
                                        : renderFormItem
                                            ? renderFormItem(item, form, readonly)
                                            : renderComponent(item, readonly, formData)}
                                </Form.Item>
                                {item.message ? (
                                    <div className="rongshiyi-pro-form__message">
                                        {item.message}
                                    </div>
                                ) : null}
                            </Col>
                        );
                    })}
                </Row>

                {!readonly ? (
                    <div className="rongshiyi-pro-form__actions">
                        {actionRender ? actionRender({ form, model: formData }) : (
                            <Space>
                                <Button type="primary" htmlType="submit">提交</Button>
                                <Button onClick={() => form.resetFields()}>重置</Button>
                            </Space>
                        )}
                    </div>
                ) : null}
            </Form>
        </div>
    );
});

ProForm.displayName = 'ProForm';
