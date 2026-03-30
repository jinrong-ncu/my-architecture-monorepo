import React, { useEffect, useMemo } from 'react';
import { useForm, Controller, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { HelpCircle, CalendarIcon } from "lucide-react";
import { FormItemConfig, ProFormProps } from './types';

export function ProForm(props: ProFormProps) {
    const {
        items,
        modelValue,
        onUpdateModelValue,
        onSubmit,
        readonly = false,
        title,
        column = 2,
        className
    } = props;

    // Build Zod Schema dynamically
    const formSchema = useMemo(() => {
        const shape: Record<string, any> = {};
        items.forEach(item => {
            if (item.component === 'divider') return;
            let fieldSchema = z.any();
            if (item.rules?.required) {
                fieldSchema = z.preprocess(
                    (val) => (val === '' ? undefined : val),
                    z.string({ required_error: item.rules.message || `${item.label}是必填项` })
                ).refine(v => v !== undefined, { message: item.rules.message || `${item.label}是必填项` });
            }
            shape[item.name] = fieldSchema;
        });
        return z.object(shape);
    }, [items]);

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: modelValue || {},
    });

    // Sync modelValue changes (only if actually different to prevent loops)
    useEffect(() => {
        if (modelValue) {
            const currentValues = form.getValues();
            const isDifferent = Object.keys(modelValue).some(key => modelValue[key] !== currentValues[key]);
            if (isDifferent) {
                form.reset(modelValue);
            }
        }
    }, [modelValue, form]);

    // Handle form submission
    const handleFormSubmit = (values: Record<string, any>) => {
        onSubmit?.(values);
    };

    // Auto-sync form changes back to parent
    useEffect(() => {
        const subscription = form.watch((value) => {
            // Only notify if we are NOT in the middle of a reset
            onUpdateModelValue?.(value as Record<string, any>);
        });
        return () => subscription.unsubscribe();
    }, [form, onUpdateModelValue]);

    const renderReadonly = (item: FormItemConfig, value: any) => {
        if (value === undefined || value === null || value === '') return <span className="text-muted-foreground">-</span>;

        switch (item.component) {
            case 'select':
            case 'radio':
            case 'checkboxGroup':
                const options = item.options?.items || [];
                if (Array.isArray(value)) {
                    return (
                        <div className="flex flex-wrap gap-1">
                            {value.map(v => {
                                const opt = options.find(o => o.value === v);
                                return <Badge key={v} variant="secondary">{opt ? opt.label : v}</Badge>;
                            })}
                        </div>
                    );
                }
                const opt = options.find(o => o.value === value);
                return <Badge variant="outline">{opt ? opt.label : value}</Badge>;
            case 'switch':
            case 'checkbox':
                return <Badge variant={value ? "default" : "secondary"}>{value ? '是' : '否'}</Badge>;
            case 'date':
                return <span>{new Date(value).toLocaleDateString()}</span>;
            default:
                return <span className="text-foreground font-medium">{String(value)}</span>;
        }
    };

    const renderField = (item: FormItemConfig) => {
        const { value } = form.getValues();
        if (item.hideHandle?.(form.getValues())) return null;

        return (
            <FormField
                key={item.name}
                control={form.control}
                name={item.name}
                render={({ field }) => (
                    <FormItem className={cn(
                        "space-y-2",
                        item.span ? `col-span-${item.span}` : "col-span-1"
                    )}>
                        <div className={cn("flex flex-col gap-1.5", item.component === 'divider' && "col-span-full pt-4")}>
                            {item.component === 'divider' ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-primary">{item.label}</span>
                                    <div className="h-[1px] bg-border flex-1" />
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-1">
                                        <FormLabel>{item.label}</FormLabel>
                                        {item.tips && <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" title={item.tips} />}
                                    </div>
                                    <FormControl>
                                        {readonly ? (
                                            <div className="h-9 flex items-center">{renderReadonly(item, field.value)}</div>
                                        ) : (
                                            <>
                                                {item.render ? item.render({ form, item, readonly }) : (
                                                    <>
                                                        {item.component === 'input' && (
                                                            <Input placeholder={item.placeholder || '请输入'} {...field} />
                                                        )}
                                                        {item.component === 'textarea' && (
                                                            <textarea
                                                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                                placeholder={item.placeholder || '请输入'}
                                                                {...field}
                                                            />
                                                        )}
                                                        {item.component === 'select' && (
                                                            <Select onValueChange={field.onChange} value={field.value ? String(field.value) : undefined}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder={item.placeholder || '请选择'} />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {item.options?.items?.map(opt => (
                                                                        <SelectItem key={opt.value} value={String(opt.value)}>
                                                                            {opt.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                        {item.component === 'switch' && (
                                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                        )}
                                                        {item.component === 'checkbox' && (
                                                            <div className="flex items-center space-x-2">
                                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                                <span className="text-sm font-normal text-muted-foreground">{item.options?.placeholder || '是'}</span>
                                                            </div>
                                                        )}
                                                        {item.component === 'date' && (
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        variant={"outline"}
                                                                        className={cn(
                                                                            "w-full justify-start text-left font-normal",
                                                                            !field.value && "text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                                        {field.value ? new Date(field.value).toLocaleDateString() : <span>选择日期</span>}
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto p-0" align="start">
                                                                    <Calendar
                                                                        mode="single"
                                                                        selected={field.value ? new Date(field.value) : undefined}
                                                                        onSelect={(date) => field.onChange(date?.toISOString())}
                                                                        initialFocus
                                                                    />
                                                                </PopoverContent>
                                                            </Popover>
                                                        )}
                                                        {/* Radio, CheckboxGroup... */}
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </FormControl>
                                    <FormMessage />
                                    {item.message && <FormDescription>{item.message}</FormDescription>}
                                </>
                            )}
                        </div>
                    </FormItem>
                )}
            />
        );
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className={cn("space-y-6", className)}>
                {title && <h3 className="text-lg font-bold tracking-tight mb-4">{title}</h3>}
                <div className={cn(
                    "grid gap-x-6 gap-y-4",
                    column === 1 ? "grid-cols-1" :
                    column === 2 ? "grid-cols-1 md:grid-cols-2" :
                    column === 3 ? "grid-cols-1 md:grid-cols-3" :
                    "grid-cols-1 md:grid-cols-4"
                )}>
                    {items.map(item => renderField(item))}
                </div>
                {!readonly && (
                    <div className="flex justify-start gap-4 pt-4">
                        <Button type="submit">提交保存</Button>
                        <Button type="button" variant="outline" onClick={() => form.reset()}>重置表单</Button>
                    </div>
                )}
            </form>
        </Form>
    );
}
