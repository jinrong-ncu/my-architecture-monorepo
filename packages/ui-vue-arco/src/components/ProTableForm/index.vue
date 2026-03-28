<template>
    <div class="pro-table-form">
        <a-table :data="innerRows" :pagination="false" :bordered="{ cell: true }" row-key="_rowKey">
            <template #columns>
                <a-table-column
                    v-for="column in props.columns"
                    :key="column.dataIndex"
                    :title="column.title"
                    :data-index="column.dataIndex"
                    :width="column.width"
                    :align="column.align"
                >
                    <template #cell="{ record }">
                        <div class="pro-table-form-cell">
                            <template v-if="column.readonly">
                                <span class="pro-table-form-readonly">{{ renderReadonlyText(column, getCellValue(record, column.dataIndex)) }}</span>
                            </template>

                            <template v-else-if="column.component === 'select'">
                                <a-select
                                    :model-value="getCellValue(record, column.dataIndex)"
                                    v-bind="column.props || {}"
                                    allow-clear
                                    @update:model-value="(value: any) => handleCellChange(record, column.dataIndex, value)"
                                >
                                    <a-option
                                        v-for="option in (column.options || [])"
                                        :key="option.value"
                                        :value="option.value"
                                        :disabled="option.disabled"
                                    >
                                        {{ option.label }}
                                    </a-option>
                                </a-select>
                            </template>

                            <template v-else-if="column.component === 'radio'">
                                <a-radio-group
                                    :model-value="getCellValue(record, column.dataIndex)"
                                    v-bind="column.props || {}"
                                    @update:model-value="(value: any) => handleCellChange(record, column.dataIndex, value)"
                                >
                                    <a-radio
                                        v-for="option in (column.options || [])"
                                        :key="option.value"
                                        :value="option.value"
                                        :disabled="option.disabled"
                                    >
                                        {{ option.label }}
                                    </a-radio>
                                </a-radio-group>
                            </template>

                            <template v-else-if="column.component === 'date'">
                                <a-date-picker
                                    :model-value="getCellValue(record, column.dataIndex)"
                                    v-bind="column.props || {}"
                                    style="width: 100%"
                                    @update:model-value="(value: any) => handleCellChange(record, column.dataIndex, value)"
                                />
                            </template>

                            <template v-else-if="column.component === 'custom'">
                                <slot
                                    :name="`cell-${column.dataIndex}`"
                                    :column="column"
                                    :record="record"
                                    :value="getCellValue(record, column.dataIndex)"
                                    :setValue="(value: any) => handleCellChange(record, column.dataIndex, value)"
                                />
                            </template>

                            <template v-else>
                                <a-input
                                    :model-value="getCellValue(record, column.dataIndex)"
                                    v-bind="column.props || {}"
                                    allow-clear
                                    @update:model-value="(value: any) => handleCellChange(record, column.dataIndex, value)"
                                />
                            </template>

                            <div v-if="getCellError(record, column.dataIndex)" class="pro-table-form-error">
                                {{ getCellError(record, column.dataIndex) }}
                            </div>
                        </div>
                    </template>
                </a-table-column>

                <a-table-column
                    v-if="props.showAction !== false"
                    :title="props.actionTitle || '操作'"
                    :width="props.actionWidth || 96"
                    align="center"
                >
                    <template #cell="{ record }">
                        <a-button type="text" status="danger" size="small" @click="removeItem(record._rowKey)">
                            删除
                        </a-button>
                    </template>
                </a-table-column>
            </template>
        </a-table>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import dayjs from 'dayjs';
import type {
    ProTableFormColumn,
    ProTableFormExpose,
    ProTableFormProps,
    ProTableFormRule,
} from './types';

interface InternalRow extends Record<string, any> {
    _rowKey: string;
    _errors: Record<string, string>;
}

const props = withDefaults(defineProps<ProTableFormProps>(), {
    modelValue: () => [],
    rowKeyField: 'id',
    showAction: true,
    actionTitle: '操作',
    actionWidth: 96,
    addDefaultRow: () => ({}),
});

const emit = defineEmits<{
    'update:modelValue': [value: Record<string, any>[]];
}>();

const innerRows = ref<InternalRow[]>([]);
const isSyncingFromInner = ref(false);

function createRowKey() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `row_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function isObject(value: unknown): value is Record<string, any> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cloneRow(row: Record<string, any>) {
    if (!isObject(row)) return {};
    return JSON.parse(JSON.stringify(row));
}

function splitPath(path: string) {
    return String(path || '')
        .split('.')
        .map(segment => segment.trim())
        .filter(Boolean);
}

function getByPath(source: Record<string, any>, path: string) {
    const segments = splitPath(path);
    if (segments.length === 0) return undefined;

    let current: any = source;
    for (const segment of segments) {
        if (!isObject(current) && !Array.isArray(current)) {
            return undefined;
        }
        current = (current as any)[segment];
        if (current === undefined) return undefined;
    }
    return current;
}

function setByPath(target: Record<string, any>, path: string, value: any) {
    const segments = splitPath(path);
    if (segments.length === 0) return;

    let current: Record<string, any> = target;
    for (let index = 0; index < segments.length - 1; index += 1) {
        const key = segments[index];
        if (!isObject(current[key])) {
            current[key] = {};
        }
        current = current[key];
    }

    current[segments[segments.length - 1]] = value;
}

function normalizeRows(rows: Record<string, any>[], previousRows: InternalRow[] = []) {
    return (rows || []).map((row, rowIndex) => {
        const cloned = cloneRow(row);
        const previousRow = previousRows[rowIndex];
        const rawRowKey = cloned[props.rowKeyField] || cloned._rowKey || previousRow?._rowKey;
        return {
            ...cloned,
            _rowKey: String(rawRowKey || createRowKey()),
            _errors: previousRow?._errors || {},
        } as InternalRow;
    });
}

function stripInternalFields(rows: InternalRow[]) {
    return rows.map((row) => {
        const cloned = cloneRow(row);
        delete cloned._errors;
        delete cloned._rowKey;
        return cloned;
    });
}

watch(
    () => props.modelValue,
    (rows) => {
        if (isSyncingFromInner.value) {
            isSyncingFromInner.value = false;
            return;
        }
        innerRows.value = normalizeRows(rows || [], innerRows.value);
    },
    { deep: true, immediate: true },
);

function emitModelValue() {
    isSyncingFromInner.value = true;
    emit('update:modelValue', stripInternalFields(innerRows.value));
}

function getCellValue(row: InternalRow, dataIndex: string) {
    return getByPath(row, dataIndex);
}

function clearCellError(row: InternalRow, dataIndex: string) {
    if (row._errors[dataIndex]) {
        delete row._errors[dataIndex];
    }
}

function handleCellChange(row: InternalRow, dataIndex: string, value: any) {
    setByPath(row, dataIndex, value);
    clearCellError(row, dataIndex);
    emitModelValue();
}

function getCellError(row: InternalRow, dataIndex: string) {
    return row._errors?.[dataIndex] || '';
}

function findOptionLabel(column: ProTableFormColumn, value: any) {
    const option = (column.options || []).find(item => item.value === value || String(item.value) === String(value));
    return option?.label;
}

function renderReadonlyText(column: ProTableFormColumn, value: any) {
    if (value === null || value === undefined || value === '') return '-';

    if ((column.component === 'select' || column.component === 'radio') && column.options?.length) {
        if (Array.isArray(value)) {
            const labels = value
                .map(item => findOptionLabel(column, item))
                .filter((label): label is string => !!label);
            return labels.length ? labels.join('、') : '-';
        }
        return findOptionLabel(column, value) || '-';
    }

    if (Array.isArray(value)) {
        return value.join('、') || '-';
    }

    if (dayjs.isDayjs(value)) {
        return value.format('YYYY-MM-DD HH:mm:ss');
    }

    return String(value);
}

function runRule(rule: ProTableFormRule, value: any, row: InternalRow) {
    if (rule.required) {
        const empty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
        if (empty) {
            return rule.message || '此项必填';
        }
    }

    if (rule.validator) {
        const result = rule.validator(value, row);
        if (result === false) {
            return rule.message || '校验失败';
        }
        if (typeof result === 'string' && result.trim()) {
            return result;
        }
    }

    return '';
}

async function validate() {
    let valid = true;

    innerRows.value.forEach((row) => {
        row._errors = {};

        props.columns.forEach((column) => {
            const rules = column.rules || [];
            if (rules.length === 0 || column.readonly) return;

            const value = getCellValue(row, column.dataIndex);
            for (const rule of rules) {
                const message = runRule(rule, value, row);
                if (message) {
                    row._errors[column.dataIndex] = message;
                    valid = false;
                    break;
                }
            }
        });
    });

    return valid;
}

function addItem(row?: Record<string, any>) {
    const baseRow = cloneRow(props.addDefaultRow || {});
    const appendRow = cloneRow(row || {});

    innerRows.value.push({
        ...baseRow,
        ...appendRow,
        _rowKey: createRowKey(),
        _errors: {},
    });

    emitModelValue();
}

function removeItem(rowKey: string) {
    innerRows.value = innerRows.value.filter(row => row._rowKey !== rowKey);
    emitModelValue();
}

defineExpose<ProTableFormExpose>({
    validate,
    addItem,
    removeItem,
});
</script>

<style scoped>
.pro-table-form-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
}

.pro-table-form-cell :deep(.arco-input-wrapper),
.pro-table-form-cell :deep(.arco-select-view),
.pro-table-form-cell :deep(.arco-picker),
.pro-table-form-cell :deep(.arco-radio-group) {
    width: 100%;
}

.pro-table-form-cell:has(.pro-table-form-error) :deep(.arco-input-wrapper),
.pro-table-form-cell:has(.pro-table-form-error) :deep(.arco-select-view),
.pro-table-form-cell:has(.pro-table-form-error) :deep(.arco-picker) {
    border-color: rgb(var(--danger-6));
}

.pro-table-form-readonly {
    color: var(--color-text-1);
    line-height: 22px;
    min-height: 22px;
    word-break: break-word;
}

.pro-table-form-error {
    font-size: 12px;
    color: rgb(var(--danger-6));
    line-height: 1.4;
}
</style>
