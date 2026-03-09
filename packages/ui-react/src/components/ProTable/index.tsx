import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Space } from 'antd';
import type { TableProps } from 'antd';
import type { ColumnsType, ColumnType } from 'antd/es/table';

export type ProColumnsType<RecordType = any> = (ColumnType<RecordType> & {
    valueType?: 'text' | 'select' | 'date' | 'money' | string;
    hideInTable?: boolean;
})[];

export interface ProTableProps<RecordType = any> extends Omit<TableProps<RecordType>, 'columns' | 'dataSource' | 'pagination'> {
    columns?: ProColumnsType<RecordType>;
    request?: (params: { current: number; pageSize: number;[key: string]: any }) => Promise<{ data: RecordType[]; total: number; success: boolean }>;
    rowKey?: string | ((record: RecordType) => string);
    headerTitle?: React.ReactNode;
    toolBarRender?: () => React.ReactNode[];
}

export function ProTable<RecordType extends object = any>(props: ProTableProps<RecordType>) {
    const {
        columns = [],
        request,
        rowKey = 'id',
        headerTitle,
        toolBarRender,
        ...restTableProps
    } = props;

    const [dataSource, setDataSource] = useState<RecordType[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const fetchData = useCallback(
        async (current: number, pageSize: number) => {
            if (!request) return;
            setLoading(true);
            try {
                const res = await request({ current, pageSize });
                if (res && res.success) {
                    setDataSource(res.data || []);
                    setPagination((prev) => ({
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
        [request]
    );

    useEffect(() => {
        fetchData(1, 10);
    }, [fetchData]);

    const handleTableChange: TableProps<RecordType>['onChange'] = (newPagination) => {
        fetchData(newPagination.current || 1, newPagination.pageSize || 10);
    };

    const filteredColumns = useMemo(() => {
        return columns.filter((col) => !col.hideInTable) as ColumnsType<RecordType>;
    }, [columns]);

    return (
        <div
            style={{
                backgroundColor: '#ffffff',
                padding: '24px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
            }}
        >
            {(headerTitle || toolBarRender) && (
                <div
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
                    {toolBarRender && (
                        <Space size="middle">
                            {toolBarRender().map((item, index) => (
                                <React.Fragment key={index}>{item}</React.Fragment>
                            ))}
                        </Space>
                    )}
                </div>
            )}
            <Table<RecordType>
                rowKey={rowKey}
                columns={filteredColumns}
                dataSource={request ? dataSource : (restTableProps as any).dataSource}
                loading={loading}
                pagination={
                    request
                        ? {
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: pagination.total,
                            showSizeChanger: true,
                            showQuickJumper: true,
                        }
                        : false
                }
                onChange={handleTableChange}
                {...restTableProps}
            />
        </div>
    );
}
