import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Settings,
    Copy,
    HelpCircle,
    MoreHorizontal,
    Loader2,
    Search,
    RotateCcw,
    ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProColumnType, ProTableProps } from './types';

// Helper for date formatting
function formatDate(value: any, template = 'YYYY-MM-DD') {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);

    const map: Record<string, string> = {
        YYYY: String(date.getFullYear()),
        MM: String(date.getMonth() + 1).padStart(2, '0'),
        DD: String(date.getDate()).padStart(2, '0'),
        HH: String(date.getHours()).padStart(2, '0'),
        mm: String(date.getMinutes()).padStart(2, '0'),
        ss: String(date.getSeconds()).padStart(2, '0'),
    };

    return template.replace(/YYYY|MM|DD|HH|mm|ss/g, (m) => map[m]);
}

export function ProTable<T extends Record<string, any>>(props: ProTableProps<T>) {
    const {
        columns,
        requestApi,
        rowKey = 'id',
        headerTitle,
        toolBarRender,
        showSetting = true,
        cacheKey,
        className
    } = props;

    // States
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });
    const [searchParams, setSearchParams] = useState<Record<string, any>>({});
    
    // Column Visibility
    const initialVisibility = useMemo(() => {
        if (cacheKey) {
            const cached = localStorage.getItem(`PRO_TABLE_COLUMNS_${cacheKey}`);
            if (cached) return JSON.parse(cached);
        }
        const initial: Record<string, boolean> = {};
        columns.forEach(col => {
            initial[col.dataIndex] = col.hideInTable !== true;
        });
        return initial;
    }, [columns, cacheKey]);

    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(initialVisibility);

    const toggleColumn = (dataIndex: string) => {
        const next = { ...columnVisibility, [dataIndex]: !columnVisibility[dataIndex] };
        setColumnVisibility(next);
        if (cacheKey) {
            localStorage.setItem(`PRO_TABLE_COLUMNS_${cacheKey}`, JSON.stringify(next));
        }
    };

    // Fetch Data
    const fetchData = useCallback(async (page: number, size: number, params: any) => {
        if (!requestApi) return;
        setLoading(true);
        try {
            const res = await requestApi({ page, pageSize: size, ...params });
            setData(res.data);
            setPagination(prev => ({ ...prev, current: page, total: res.total }));
        } catch (error) {
            console.error('ProTable fetch error:', error);
        } finally {
            setLoading(false);
        }
    }, [requestApi]);

    useEffect(() => {
        fetchData(1, pagination.pageSize, searchParams);
    }, []);

    const handleSearch = () => {
        fetchData(1, pagination.pageSize, searchParams);
    };

    const handleReset = () => {
        setSearchParams({});
        fetchData(1, pagination.pageSize, {});
    };

    const handlePageChange = (page: number) => {
        fetchData(page, pagination.pageSize, searchParams);
    };

    // Filter columns for display
    const visibleColumns = useMemo(() => {
        return columns.filter(col => columnVisibility[col.dataIndex] !== false);
    }, [columns, columnVisibility]);

    // Value Renderers
    const renderCell = (col: ProColumnType<T>, record: T, index: number) => {
        const value = record[col.dataIndex];
        
        if (col.render) return col.render(value, record, index);

        switch (col.valueType) {
            case 'enum':
            case 'select':
                const opt = col.options?.find(o => o.value === value);
                return <Badge variant="secondary">{opt ? opt.label : String(value)}</Badge>;
            case 'date':
                return <span>{formatDate(value, col.dateFormat)}</span>;
            case 'switch':
                return (
                    <Switch
                        checked={value === (col.switchConfig?.activeValue ?? true)}
                        disabled={col.switchConfig?.disabled?.(record)}
                        onCheckedChange={(checked) => {
                            const newVal = checked ? (col.switchConfig?.activeValue ?? true) : (col.switchConfig?.inactiveValue ?? false);
                            col.switchConfig?.onChange?.(newVal, record);
                        }}
                    />
                );
            case 'image':
                return value ? <img src={value} className="h-10 w-10 rounded object-cover border" alt="" /> : null;
            case 'link':
                return <a href={value} target="_blank" className="text-primary hover:underline">{value}</a>;
            case 'html':
                return <div dangerouslySetInnerHTML={{ __html: value }} />;
            case 'array':
                return <span>{Array.isArray(value) ? value.join(', ') : ''}</span>;
            case 'operation':
                return (
                    <div className="flex items-center gap-2">
                        {col.operation?.map((op, i) => (
                            <Button
                                key={i}
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2"
                                disabled={op.disabled?.(record)}
                                onClick={() => op.onClick(record)}
                            >
                                {op.icon && <span className="mr-1">{op.icon}</span>}
                                {op.label}
                            </Button>
                        ))}
                    </div>
                );
            default:
                return (
                    <div className="flex items-center gap-1">
                        <span>{String(value ?? '-')}</span>
                        {col.copyable && value && (
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(String(value));
                                }}
                                className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground"
                            >
                                <Copy className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className={cn("space-y-4", className)}>
            {/* Search Area */}
            {columns.some(c => c.search) && (
                <div className="p-4 border rounded-lg bg-card grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {columns.filter(c => c.search).map(col => (
                        <div key={col.dataIndex} className="space-y-1.5">
                            <label className="text-sm font-medium">{col.title}</label>
                            {col.valueType === 'select' || col.valueType === 'enum' ? (
                                <Select
                                    value={searchParams[col.dataIndex]}
                                    onValueChange={(val) => setSearchParams(p => ({ ...p, [col.dataIndex]: val }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="全部" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {col.options?.map(opt => (
                                            <SelectItem key={opt.value} value={String(opt.value)}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input
                                    placeholder="请输入"
                                    value={searchParams[col.dataIndex] || ''}
                                    onChange={(e) => setSearchParams(p => ({ ...p, [col.dataIndex]: e.target.value }))}
                                />
                            )}
                        </div>
                    ))}
                    <div className="flex items-end gap-2">
                        <Button onClick={handleSearch} className="gap-1.5">
                            <Search className="h-4 w-4" />
                            查询
                        </Button>
                        <Button variant="outline" onClick={handleReset} className="gap-1.5">
                            <RotateCcw className="h-4 w-4" />
                            重置
                        </Button>
                    </div>
                </div>
            )}

            {/* Toolbar Area */}
            <div className="flex justify-between items-center">
                <div className="text-lg font-semibold">{headerTitle}</div>
                <div className="flex items-center gap-2">
                    {toolBarRender?.().map((item, i) => <React.Fragment key={i}>{item}</React.Fragment>)}
                    {showSetting && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 gap-1.5">
                                    <Settings className="h-4 w-4" />
                                    列设置
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56" align="end">
                                <div className="space-y-3">
                                    <div className="text-sm font-medium border-b pb-2">列展示控制</div>
                                    <div className="max-h-60 overflow-y-auto space-y-2">
                                        {columns.map(col => (
                                            <div key={col.dataIndex} className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`col-${col.dataIndex}`}
                                                    checked={columnVisibility[col.dataIndex] !== false}
                                                    onCheckedChange={() => toggleColumn(col.dataIndex)}
                                                />
                                                <label htmlFor={`col-${col.dataIndex}`} className="text-sm cursor-pointer select-none">
                                                    {col.title}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-xs h-7"
                                        onClick={() => setColumnVisibility(Object.fromEntries(columns.map(c => [c.dataIndex, true])))}
                                    >
                                        重置列表
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </div>

            {/* Table Area */}
            <div className="border rounded-md relative bg-card overflow-hidden">
                {loading && (
                    <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                <Table>
                    <TableHeader>
                        <TableRow>
                            {visibleColumns.map(col => (
                                <TableHead
                                    key={col.dataIndex}
                                    className={cn(
                                        col.align === 'center' && "text-center",
                                        col.align === 'right' && "text-right"
                                    )}
                                    style={{ width: col.width }}
                                >
                                    <div className={cn(
                                        "flex items-center gap-1",
                                        col.align === 'center' && "justify-center",
                                        col.align === 'right' && "justify-end"
                                    )}>
                                        {col.title}
                                        {col.tooltip && (
                                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                        )}
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length > 0 ? (
                            data.map((record, rowIndex) => (
                                <TableRow key={typeof rowKey === 'function' ? rowKey(record) : record[rowKey] || rowIndex}>
                                    {visibleColumns.map(col => (
                                        <TableCell
                                            key={col.dataIndex}
                                            className={cn(
                                                col.align === 'center' && "text-center",
                                                col.align === 'right' && "text-right"
                                            )}
                                        >
                                            {renderCell(col, record, rowIndex)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={visibleColumns.length} className="h-32 text-center text-muted-foreground">
                                    暂无数据
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* Pagination Area */}
                <div className="p-4 border-t flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        共 {pagination.total} 条记录
                    </div>
                    {pagination.total > 0 && (
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => pagination.current > 1 && handlePageChange(pagination.current - 1)}
                                        className="cursor-pointer"
                                    />
                                </PaginationItem>
                                {/* Simple Pagination logic */}
                                {Array.from({ length: Math.ceil(pagination.total / pagination.pageSize) })
                                    .map((_, i) => i + 1)
                                    .filter(p => Math.abs(p - pagination.current) <= 1 || p === 1 || p === Math.ceil(pagination.total / pagination.pageSize))
                                    .map((p, i, arr) => (
                                        <React.Fragment key={p}>
                                            {i > 0 && p - arr[i - 1] > 1 && <PaginationEllipsis />}
                                            <PaginationItem>
                                                <PaginationLink
                                                    isActive={p === pagination.current}
                                                    onClick={() => handlePageChange(p)}
                                                    className="cursor-pointer"
                                                >
                                                    {p}
                                                </PaginationLink>
                                            </PaginationItem>
                                        </React.Fragment>
                                    ))}
                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => pagination.current < Math.ceil(pagination.total / pagination.pageSize) && handlePageChange(pagination.current + 1)}
                                        className="cursor-pointer"
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}
                </div>
            </div>
        </div>
    );
}
