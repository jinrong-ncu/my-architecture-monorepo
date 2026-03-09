import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Table, Space, Button, Form, Row, Col, Input, Select, DatePicker,
    Tooltip, Popover, Checkbox, Empty, Divider, Switch, Image, message, Dropdown
} from 'antd';
import type { TableProps } from 'antd';
import {
    SettingOutlined, CopyOutlined, MoreOutlined,
    QuestionCircleOutlined
} from '@ant-design/icons';
import type { ProTableProps } from './types';

function formatDateByTemplate(value: any, template = 'YYYY-MM-DD') {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    const tokenMap: Record<string, string> = {
        YYYY: String(date.getFullYear()),
        MM: String(date.getMonth() + 1).padStart(2, '0'),
        DD: String(date.getDate()).padStart(2, '0'),
        HH: String(date.getHours()).padStart(2, '0'),
        mm: String(date.getMinutes()).padStart(2, '0'),
        ss: String(date.getSeconds()).padStart(2, '0'),
    };

    return template.replace(/YYYY|MM|DD|HH|mm|ss/g, (token) => tokenMap[token]);
}

function setValueByDataIndex(target: any, dataIndex: any, value: any) {
    const path = Array.isArray(dataIndex) ? dataIndex : [dataIndex];
    if (path.length === 0) return target;

    const cloned = Array.isArray(target) ? [...target] : { ...target };
    let cursor = cloned;

    for (let i = 0; i < path.length - 1; i += 1) {
        const key = path[i];
        const next = cursor?.[key];
        cursor[key] = Array.isArray(next) ? [...next] : { ...(next || {}) };
        cursor = cursor[key];
    }

    cursor[path[path.length - 1]] = value;
    return cloned;
}

export function ProTable<RecordType extends object = any>(props: ProTableProps<RecordType>) {
    const {
        columns = [],
        request,
        requestApi,
        rowKey = 'id',
        headerTitle,
        toolBarRender,
        cacheKey,
        showSetting = true,
        ...restTableProps
    } = props;

    const actualRequest = requestApi || request;

    const getRecordKey = useCallback((record: RecordType) => {
        if (typeof rowKey === 'function') {
            return rowKey(record);
        }
        return (record as any)?.[rowKey as string];
    }, [rowKey]);

    // 状态
    const [dataSource, setDataSource] = useState<RecordType[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    // 搜索表单
    const [searchForm] = Form.useForm();
    const searchColumns = useMemo(() => columns.filter(col => col.search), [columns]);

    // 列显隐
    const getInitialVisibility = () => {
        if (cacheKey) {
            try {
                const cached = localStorage.getItem(`PRO_TABLE_COLUMNS_${cacheKey}`);
                if (cached) return JSON.parse(cached);
            } catch (e) {
                console.warn('ProTable load cache failed:', e);
            }
        }
        const initial: Record<string, boolean> = {};
        columns.forEach(col => {
            const key = (col.dataIndex || col.key) as string;
            if (key) {
                initial[key] = col.hideInTable !== true;
            }
        });
        return initial;
    };

    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(getInitialVisibility());

    const handleVisibilityChange = (checkedValues: any[]) => {
        const newVisibility = { ...columnVisibility };
        columns.forEach(col => {
            const key = (col.dataIndex || col.key) as string;
            if (key) {
                newVisibility[key] = checkedValues.includes(key);
            }
        });
        setColumnVisibility(newVisibility);
        if (cacheKey) {
            localStorage.setItem(`PRO_TABLE_COLUMNS_${cacheKey}`, JSON.stringify(newVisibility));
        }
    };

    const resetColumnsToDefault = () => {
        const initial: Record<string, boolean> = {};
        columns.forEach(col => {
            const key = (col.dataIndex || col.key) as string;
            if (key) {
                initial[key] = true;
            }
        });
        setColumnVisibility(initial);
        if (cacheKey) {
            localStorage.setItem(`PRO_TABLE_COLUMNS_${cacheKey}`, JSON.stringify(initial));
        }
    };

    // 获取数据
    const fetchData = useCallback(
        async (current: number, pageSize: number, searchParams = {}) => {
            if (!actualRequest) return;
            setLoading(true);
            try {
                const payload = { ...searchParams, page: current, pageSize, current };
                const res = await actualRequest(payload);
                if (res) {
                    setDataSource(res.data || []);
                    setPagination(prev => ({
                        ...prev,
                        current,
                        pageSize,
                        total: res.total || 0,
                    }));
                }
            } catch (error) {
                console.error('ProTable request error:', error);
            } finally {
                setLoading(false);
            }
        },
        [actualRequest]
    );

    useEffect(() => {
        fetchData(1, 10, searchForm.getFieldsValue());
    }, [fetchData, searchForm]);

    const handleTableChange: TableProps<RecordType>['onChange'] = (newPagination) => {
        fetchData(newPagination.current || 1, newPagination.pageSize || 10, searchForm.getFieldsValue());
    };

    const onSearch = (values: any) => {
        const searchColumnMap = new Map(
            searchColumns.map((col) => [String(col.dataIndex || col.key), col])
        );

        const formattedValues = { ...values };
        Object.keys(formattedValues).forEach(key => {
            const col = searchColumnMap.get(key);
            const val = formattedValues[key];
            if (col?.valueType === 'date' && val && typeof val.format === 'function') {
                formattedValues[key] = val.format(col.dateFormat || 'YYYY-MM-DD');
            }
        });
        fetchData(1, pagination.pageSize, formattedValues);
    };

    const onReset = () => {
        searchForm.resetFields();
        fetchData(1, pagination.pageSize, {});
    };

    // 处理列配置（附加自定义渲染）
    const processedColumns = useMemo(() => {
        return columns
            .filter(col => {
                const key = (col.dataIndex || col.key) as string;
                if (!key) return true;
                return columnVisibility[key] !== false;
            })
            .map(col => {
                const finalCol = { ...col } as any;

                // 为标题附加提示
                if (col.tooltip) {
                    finalCol.title = (
                        <Space size={4}>
                            {col.title as React.ReactNode}
                            <Tooltip title={col.tooltip}>
                                <QuestionCircleOutlined style={{ color: 'rgba(0,0,0,0.45)', cursor: 'help' }} />
                            </Tooltip>
                        </Space>
                    );
                }

                // 根据 valueType 映射渲染逻辑
                if (!finalCol.render) {
                    finalCol.render = (text: any, record: RecordType, index: number) => {
                        let renderedNode: React.ReactNode = text;

                        switch (col.valueType) {
                            case 'slot':
                                renderedNode = col.renderSlot?.(text, record, index) || text;
                                break;
                            case 'image':
                                {
                                    let srcList: string[] = [];
                                    if (Array.isArray(text)) srcList = text.filter(Boolean);
                                    else if (typeof text === 'string') srcList = [text];

                                    renderedNode = srcList.length > 0 ? (
                                        <Image src={srcList[0]} height={40} preview={{ src: srcList[0] }} />
                                    ) : <span style={{ color: '#999' }}>暂无图片</span>;
                                }
                                break;
                            case 'video':
                                renderedNode = text ? <video src={text} height={40} controls /> : <span style={{ color: '#999' }}>暂无视频</span>;
                                break;
                            case 'html':
                                renderedNode = <span dangerouslySetInnerHTML={{ __html: text || '' }} />;
                                break;
                            case 'date':
                                {
                                    renderedNode = text ? formatDateByTemplate(text, col.dateFormat || 'YYYY-MM-DD') : '-';
                                }
                                break;
                            case 'switch':
                                renderedNode = (
                                    <Switch
                                        checked={text === (col.switchConfig?.activeValue ?? true)}
                                        disabled={col.switchConfig?.disabled?.(record)}
                                        onChange={(checked) => {
                                            const val = checked ? (col.switchConfig?.activeValue ?? true) : (col.switchConfig?.inactiveValue ?? false);
                                            if (col.dataIndex !== undefined) {
                                                const currentRecordKey = getRecordKey(record);
                                                setDataSource((prev) => prev.map((item) => {
                                                    if (getRecordKey(item) !== currentRecordKey) return item;
                                                    return setValueByDataIndex(item, col.dataIndex, val);
                                                }));
                                            }
                                            col.switchConfig?.onChange?.(val, record);
                                        }}
                                        checkedChildren={col.switchConfig?.activeText}
                                        unCheckedChildren={col.switchConfig?.inactiveText}
                                    />
                                );
                                break;
                            case 'enum':
                            case 'select':
                                {
                                    const hit = col.options?.find(opt => opt.value === text);
                                    renderedNode = hit ? hit.label : text;
                                }
                                break;
                            case 'array':
                                renderedNode = Array.isArray(text) ? text.join(', ') : String(text || '');
                                break;
                            case 'link':
                                renderedNode = <a href={text}>{text}</a>;
                                break;
                            case 'operation':
                                if (col.operation) {
                                    const visibleOps = col.operation.slice(0, 3);
                                    const dropOps = col.operation.length > 3 ? col.operation.slice(3) : [];

                                    renderedNode = (
                                        <Space>
                                            {visibleOps.map((btn, i) => (
                                                <Button
                                                    key={i}
                                                    type="link"
                                                    size="small"
                                                    disabled={btn.disabled?.(record)}
                                                    onClick={() => btn.onClick(record)}
                                                    icon={btn.icon}
                                                    style={{ padding: 0 }}
                                                >
                                                    {btn.label}
                                                </Button>
                                            ))}
                                            {dropOps.length > 0 && (
                                                <Dropdown menu={{
                                                    items: dropOps.map((btn, i) => ({
                                                        key: String(i),
                                                        label: (
                                                            <div onClick={() => !btn.disabled?.(record) && btn.onClick(record)}>
                                                                {btn.icon && <span style={{ marginRight: 8 }}>{btn.icon}</span>}
                                                                {btn.label}
                                                            </div>
                                                        ),
                                                        disabled: btn.disabled?.(record),
                                                    }))
                                                }}>
                                                    <Button type="link" size="small" icon={<MoreOutlined />} />
                                                </Dropdown>
                                            )}
                                        </Space>
                                    );
                                }
                                break;
                            default:
                                renderedNode = text;
                        }

                        // 可复制能力增强
                        if (col.copyable && text) {
                            return (
                                <Space>
                                    {renderedNode}
                                    <Tooltip title="复制">
                                        <CopyOutlined
                                            style={{ color: '#1890ff', cursor: 'pointer' }}
                                            onClick={() => {
                                                navigator.clipboard.writeText(String(text));
                                                message.success('复制成功');
                                            }}
                                        />
                                    </Tooltip>
                                </Space>
                            );
                        }
                        return renderedNode;
                    };
                }

                return finalCol;
            });
    }, [columns, columnVisibility]);

    // 渲染列设置勾选项
    const columnOptions = useMemo(() => {
        return columns.map(col => {
            const key = (col.dataIndex || col.key) as string;
            return {
                label: col.title as React.ReactNode,
                value: key,
                disabled: !key
            };
        }).filter(opt => opt.value); // 仅保留带 key/dataIndex 的项
    }, [columns]);

    const checkedColumnValues = useMemo(() => {
        return Object.keys(columnVisibility).filter(k => columnVisibility[k]);
    }, [columnVisibility]);

    return (
        <div
            className="rongshiyi-pro-table"
            style={{
                backgroundColor: '#ffffff',
                padding: '24px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
            }}
        >
            {/* 搜索表单 */}
            {searchColumns.length > 0 && (
                <div className="pro-table-search" style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px dashed #f0f0f0' }}>
                    <Form form={searchForm} layout="horizontal" onFinish={onSearch}>
                        <Row gutter={[16, 16]}>
                            {searchColumns.map(col => {
                                const key = (col.dataIndex || col.key) as string;
                                return (
                                    <Col xs={24} sm={12} md={8} lg={6} key={key}>
                                        <Form.Item name={key} label={col.title as React.ReactNode} style={{ marginBottom: 0 }}>
                                            {col.valueType === 'select' || col.valueType === 'enum' ? (
                                                <Select placeholder="请选择" allowClear options={col.options} />
                                            ) : col.valueType === 'date' ? (
                                                <DatePicker style={{ width: '100%' }} allowClear format={col.dateFormat || 'YYYY-MM-DD'} />
                                            ) : (
                                                <Input placeholder="请输入" allowClear />
                                            )}
                                        </Form.Item>
                                    </Col>
                                );
                            })}
                            <Col style={{ flex: 'auto', textAlign: 'right' }}>
                                <Space>
                                    <Button type="primary" htmlType="submit">查询</Button>
                                    <Button onClick={onReset}>重置</Button>
                                </Space>
                            </Col>
                        </Row>
                    </Form>
                </div>
            )}

            {/* 工具栏 */}
            {(headerTitle || toolBarRender || showSetting) && (
                <div
                    className="pro-table-toolbar"
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px',
                    }}
                >
                    <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>
                        {headerTitle}
                    </div>
                    <Space size="middle">
                        {toolBarRender && toolBarRender().map((item, index) => (
                            <React.Fragment key={index}>{item}</React.Fragment>
                        ))}

                        {showSetting && (
                            <Popover
                                placement="bottomRight"
                                trigger="click"
                                content={
                                    <div style={{ width: 200, maxHeight: 300, overflowY: 'auto' }}>
                                        {columnOptions.length > 0 ? (
                                            <Checkbox.Group
                                                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                                                options={columnOptions}
                                                value={checkedColumnValues}
                                                onChange={handleVisibilityChange}
                                            />
                                        ) : (
                                            <Empty description="暂无可配置列" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                        )}
                                        <Divider style={{ margin: '8px 0' }} />
                                        <div style={{ textAlign: 'center' }}>
                                            <Button type="link" size="small" onClick={resetColumnsToDefault}>重置默认</Button>
                                        </div>
                                    </div>
                                }
                            >
                                <Button icon={<SettingOutlined />} size="middle">列设置</Button>
                            </Popover>
                        )}
                    </Space>
                </div>
            )}

            {/* 表格 */}
            <Table<RecordType>
                rowKey={rowKey}
                columns={processedColumns}
                dataSource={actualRequest ? dataSource : (restTableProps as any).dataSource}
                loading={loading}
                pagination={
                    actualRequest
                        ? {
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: pagination.total,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total) => `共 ${total} 条`
                        }
                        : false
                }
                onChange={handleTableChange}
                {...restTableProps}
            />
        </div>
    );
}
