<template>
    <div class="rongshiyi-pro-table">
        <!-- 工具栏：列设置按钮 -->
        <div class="pro-table-toolbar" v-if="props.showSetting !== false">
            <a-popover placement="bottom" :width="280">
                <a-button type="outline" size="small">
                    <template #icon><icon-settings /></template>
                    列设置
                </a-button>

                <template #content>
                    <div class="pro-table-setting-panel">
                        <!-- 列表 -->
                        <div class="setting-content" v-if="currentColumns.length > 0">
                            <a-checkbox-group
                                :model-value="currentColumns.filter(c => c.visible !== false).map(c => c.dataIndex)"
                                @update:model-value="handleColumnVisibilityChange"
                            >
                                <a-checkbox v-for="col in currentColumns" :key="col.dataIndex" :value="col.dataIndex">
                                    {{ col.title }}
                                </a-checkbox>
                            </a-checkbox-group>
                        </div>

                        <a-empty v-else description="暂无可配置列" />

                        <!-- 分割线 -->
                        <a-divider style="margin: 8px 0;" v-if="currentColumns.length > 0" />

                        <!-- 重置按钮 -->
                        <div class="setting-actions" v-if="currentColumns.length > 0">
                            <a-button type="text" size="small" @click="resetColumnsToDefault">
                                重置默认
                            </a-button>
                        </div>
                    </div>
                </template>
            </a-popover>
        </div>

        <!-- 顶部搜索表单区域 -->
        <div class="pro-table-search" v-if="searchColumns.length > 0">
            <a-form :model="searchModel" layout="horizontal" auto-label-width @submit="handleSearch">
                <a-grid :cols="{ xs: 1, sm: 2, md: 3, lg: 4, xl: 4 }" :col-gap="10" :row-gap="10">
                    <a-grid-item v-for="col in searchColumns" :key="col.dataIndex">
                        <a-form-item :field="col.dataIndex" :label="col.title">

                            <!-- 动态渲染不同类型的输入控件 -->
                            <template v-if="col.valueType === 'select'">
                                <a-select v-model="searchModel[col.dataIndex as string]" :options="col.options"
                                    placeholder="请选择" allow-clear />
                            </template>

                            <template v-else-if="col.valueType === 'date'">
                                <a-date-picker v-model="searchModel[col.dataIndex as string]" style="width: 100%"
                                    allow-clear />
                            </template>

                            <!-- 默认降级为普通输入框 -->
                            <template v-else>
                                <a-input v-model="searchModel[col.dataIndex as string]" placeholder="请输入" allow-clear />
                            </template>

                        </a-form-item>
                    </a-grid-item>

                    <!-- 搜索操作按钮组 -->
                    <a-grid-item class="search-actions">
                        <a-space>
                            <a-button type="primary" html-type="submit">查询</a-button>
                            <a-button @click="handleReset">重置</a-button>
                        </a-space>
                    </a-grid-item>
                </a-grid>
            </a-form>
        </div>

        <!-- 底部数据表格展示区域 -->
        <div class="pro-table-content">
            <a-table :data="tableData" :loading="loading" :pagination="pagination" :scroll="computedScroll"
                @page-change="handlePageChange" @page-size-change="handlePageSizeChange">

                <template #columns>
                    <a-table-column v-for="col in displayColumns" :key="col.dataIndex" :title="col.title"
                        :data-index="col.dataIndex" :width="col.width" :align="col.align" :fixed="col.fixed">

                        <!-- 拦截表头插槽：实现 tooltip 增强 -->
                        <template #title>
                            <span>{{ col.title }}</span>
                            <a-tooltip v-if="(col as ProColumnData).tooltip" :content="(col as ProColumnData).tooltip">
                                <icon-question-circle
                                    style="margin-left: 4px; color: var(--color-text-3); cursor: pointer;" />
                            </a-tooltip>
                        </template>

                        <!-- 拦截数据单元格插槽 -->
                        <template #cell="{ record, rowIndex }">
                            <!-- 1. 首先检查是否有外部重写该列的插槽 (业务层传进来的 #slotName) -->
                            <slot v-if="col.slotName && $slots[col.slotName as string]" :name="col.slotName"
                                :column="col" :record="record" :rowIndex="rowIndex">
                            </slot>

                            <!-- 2. 如果没有被重写，执行内部智能映射逻辑 -->
                            <template v-else>
                                <!-- valueType === 'slot' -->
                                <template v-if="col.valueType === 'slot'">
                                    <slot :name="col.componentSlot || col.slotName" :record="record" :column="col"
                                        :rowIndex="rowIndex" />
                                </template>

                                <!-- valueType === 'image' -->
                                <template v-else-if="col.valueType === 'image'">
                                    <template v-if="getImageListFromValue(record[col.dataIndex || '']).length > 0">
                                        <div class="pro-table-image-preview-wrap"
                                            @click="handleImagePreview(record[col.dataIndex || ''])">
                                            <a-image :src="getImageListFromValue(record[col.dataIndex || ''])[0]" height="80"
                                                :preview="false" />
                                            <div class="pro-table-image-preview-mask">
                                                <icon-eye class="pro-table-image-preview-icon" />
                                            </div>
                                        </div>
                                    </template>
                                    <span v-else style="color: var(--color-text-4)">暂无图片</span>
                                </template>

                                <!-- valueType === 'video' -->
                                <template v-else-if="col.valueType === 'video'">
                                    <video v-if="record[col.dataIndex || '']" :src="record[col.dataIndex || '']"
                                        height="40" controls />
                                    <span v-else style="color: var(--color-text-4)">暂无视频</span>
                                </template>

                                <!-- valueType === 'html' -->
                                <template v-else-if="col.valueType === 'html'">
                                    <span v-html="record[col.dataIndex || '']"></span>
                                </template>

                                <!-- valueType === 'date' -->
                                <template v-else-if="col.valueType === 'date'">
                                    {{ formatDate(record[col.dataIndex || ''], col.dateFormat) }}
                                </template>

                                <!-- valueType === 'switch' -->
                                <template v-else-if="col.valueType === 'switch'">
                                    <a-switch v-model="record[col.dataIndex || '']"
                                        :checked-text="col.switchConfig?.activeText"
                                        :unchecked-text="col.switchConfig?.inactiveText"
                                        :checked-value="col.switchConfig?.activeValue ?? true"
                                        :unchecked-value="col.switchConfig?.inactiveValue ?? false"
                                        :disabled="col.switchConfig?.disabled?.(record)"
                                        @change="(val: any) => col.switchConfig?.onChange?.(val, record)" />
                                </template>

                                <!-- valueType === 'enum' || 'select' -->
                                <template v-else-if="col.valueType === 'enum' || col.valueType === 'select'">
                                    {{ getEnumLabel(record[col.dataIndex || ''], col.options) }}
                                </template>

                                <!-- valueType === 'array' -->
                                <template v-else-if="col.valueType === 'array'">
                                    {{ formatArray(record[col.dataIndex || '']) }}
                                </template>

                                <!-- valueType === 'link' -->
                                <template v-else-if="col.valueType === 'link'">
                                    <a-link>{{ record[col.dataIndex || ''] }}</a-link>
                                </template>

                                <!-- valueType === 'operation' -->
                                <template v-else-if="col.valueType === 'operation'">
                                    <a-space>
                                        <template v-for="(btn, index) in getVisibleOperations(col.operation, record)"
                                            :key="index">
                                            <a-button type="text" size="small" :disabled="btn.disabled?.(record)"
                                                @click="btn.onClick(record)">
                                                <!-- 支持图标和文字 -->
                                                <template #icon v-if="btn.icon">
                                                    <component :is="btn.icon" />
                                                </template>
                                                {{ btn.label }}
                                            </a-button>
                                        </template>

                                        <a-dropdown v-if="getDropdownOperations(col.operation, record).length > 0">
                                            <a-button type="text" size="small">
                                                <template #icon><icon-more /></template>
                                            </a-button>
                                            <template #content>
                                                <a-doption
                                                    v-for="(btn, index) in getDropdownOperations(col.operation, record)"
                                                    :key="index" :disabled="btn.disabled?.(record)"
                                                    @click="btn.onClick(record)">
                                                    <template #icon v-if="btn.icon">
                                                        <component :is="btn.icon" />
                                                    </template>
                                                    {{ btn.label }}
                                                </a-doption>
                                            </template>
                                        </a-dropdown>
                                    </a-space>
                                </template>

                                <!-- 兜底：直接输出原值 -->
                                <template v-else>
                                    <span>{{ record[col.dataIndex || ''] }}</span>
                                    <!-- 一键复制增强 -->
                                    <a-tooltip v-if="col.copyable && record[col.dataIndex || '']" content="点击复制">
                                        <a-button type="text" size="mini"
                                            style="margin-left: 4px; padding: 0 4px; height: 20px;"
                                            @click="handleCopy(record[col.dataIndex || ''])">
                                            <template #icon><icon-copy /></template>
                                        </a-button>
                                    </a-tooltip>
                                </template>
                            </template>
                        </template>
                    </a-table-column>
                </template>

                <!-- 其他非列相关的插槽（如 empty 等）原样击穿给 a-table -->
                <template v-for="(_, slotName) in $slots" #[slotName]="slotProps" :key="slotName">
                    <!-- 过滤掉已手动处理的插槽 -->
                    <slot v-if="!displayColumns.find(c => c.slotName === slotName) && slotName !== 'th'" :name="slotName"
                        v-bind="slotProps || {}"></slot>
                </template>
            </a-table>

            <a-image-preview-group :src-list="imagePreviewList" :visible="imagePreviewVisible"
                :current="imagePreviewCurrent" :infinite="true"
                @update:visible="(visible:boolean)=>imagePreviewVisible=visible"
                @update:current="(current:number)=>imagePreviewCurrent=current" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import { IconQuestionCircle, IconCopy, IconMore, IconSettings, IconEye } from '@arco-design/web-vue/es/icon';
import dayjs from 'dayjs';
import type { ProTableProps, ProColumnData } from './types';

/**
 * 内部列配置扩展，增加 visible 标记
 */
interface ColumnWithVisibility extends ProColumnData {
    visible?: boolean;
}

// ==========================================
// 1. 属性定义与基础状态声明
// ==========================================
const props = defineProps<ProTableProps>();

const loading = ref(false);
const tableData = ref<any[]>([]);
const searchModel = reactive<Record<string, any>>({});
const imagePreviewVisible = ref(false);
const imagePreviewCurrent = ref(0);
const imagePreviewList = ref<string[]>([]);

// 维护当前列的可见性状态（不直接修改原始 columns）
const currentColumns = ref<ColumnWithVisibility[]>([]);

const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
    showTotal: true,
    showPageSize: true
});

// ==========================================
// 2. 派生状态计算 (Computed)
// ==========================================
// 过滤出所有标示为需要被搜索的列配置
const searchColumns = computed(() => {
    return props.columns.filter((col: ProColumnData) => col.search === true);
});

// 重构 columns 配置，强制让带有特殊渲染逻辑的列走自定义插槽代理
const tableColumnsWithSlotName = computed(() => {
    return currentColumns.value.map((col) => {
        // 如果列配置了特殊渲染配置，但却未申明 slotName，
        // 强制打上一个 slotName 标记，从而引导 a-table 将其交由内部捕获
        const needsCustomRender = col.valueType || col.copyable;
        if (needsCustomRender && !col.slotName) {
            return {
                ...col,
                slotName: col.dataIndex // 以 dataIndex 作为默认的插槽标识
            };
        }
        return col;
    });
});

// 计算过滤后的显示列（排除 visible=false 的列）
const displayColumns = computed(() => {
    return tableColumnsWithSlotName.value.filter(col => col.visible !== false) as ProColumnData[];
});

// 计算自适应的滚动维度配置：如果业务没传，但是配置有 fixed 列，则提供 max-content 给 Arco 以激活固定列机制
const computedScroll = computed(() => {
    if (props.scroll) {
        return props.scroll;
    }
    const hasFixed = props.columns.some(col => !!col.fixed);
    if (hasFixed) {
        return { x: 'max-content' };
    }
    return undefined;
});

// ==========================================
// 3. 核心工具与渲染辅助函数 (Helpers)
// ==========================================

/**
 * 格式化日期：支持单日期与数据范围
 */
const formatDate = (val: any, formatStr = 'YYYY-MM-DD') => {
    if (!val) return '-';
    if (Array.isArray(val) && val.length === 2) {
        return `${dayjs(val[0]).format(formatStr)} 到 ${dayjs(val[1]).format(formatStr)}`;
    }
    return dayjs(val).format(formatStr);
};

/**
 * 获取翻译字典标签
 */
const getEnumLabel = (val: any, options?: any[]) => {
    if (!options) return val;
    const hit = options.find(opt => opt.value === val);
    return hit ? hit.label : val;
};

/**
 * 格式化数组
 */
const formatArray = (val: any) => {
    if (Array.isArray(val)) {
        return val.join(', ');
    }
    return String(val);
};

/**
 * 获取外显操作按钮（最多截取前 2 个，如果总数超过 3 个）
 */
const getVisibleOperations = (operations?: any[], record?: any) => {
    if (!operations) return [];
    if (operations.length <= 3) return operations;
    return operations.slice(0, 2);
};

/**
 * 获取下拉隐藏的操作按钮，即超过 2 个后的所有按钮
 */
const getDropdownOperations = (operations?: any[], record?: any) => {
    if (!operations || operations.length <= 3) return [];
    return operations.slice(2);
};

/**
 * 处理一键复制到剪贴板
 */
const handleCopy = async (text: string) => {
    try {
        await navigator.clipboard.writeText(String(text));
        Message.success('复制成功');
    } catch (err) {
        Message.error('复制失败，请检查浏览器权限');
    }
};

const getImageListFromValue = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value.filter(item => typeof item === 'string' && item.trim().length > 0);
    }
    if (typeof value === 'string' && value.trim().length > 0) {
        return [value];
    }
    return [];
};

const handleImagePreview = (value: any) => {
    const imageList = getImageListFromValue(value);
    if (imageList.length === 0) {
        Message.info('暂无可预览图片');
        return;
    }
    imagePreviewList.value = imageList;
    imagePreviewCurrent.value = 0;
    imagePreviewVisible.value = true;
};

// ==========================================
// 4. 核心交互函数集 (Actions)
// ==========================================

/**
 * 获取表格核心数据
 */
const fetchData = async () => {
    if (!props.requestApi) return;

    loading.value = true;
    try {
        // 组装查询参数：分页信息 + 表单条件
        const params = {
            page: pagination.current,
            pageSize: pagination.pageSize,
            ...searchModel
        };

        // 执行由外部注入的数据请求逻辑
        const { data, total } = await props.requestApi(params);
        tableData.value = data || [];
        pagination.total = total || 0;
    } catch (err) {
        console.error('ProTable 请求数据失败:', err);
    } finally {
        loading.value = false;
    }
};

/**
 * 触发查询
 */
const handleSearch = () => {
    pagination.current = 1; // 搜索时重置回第一页
    fetchData();
};

/**
 * 重置查询条件
 */
const handleReset = () => {
    // 清空 reactive 对象中的绑定值
    Object.keys(searchModel).forEach(key => {
        searchModel[key] = undefined;
    });
    handleSearch();
};

/**
 * 分页页码切换
 */
const handlePageChange = (page: number) => {
    pagination.current = page;
    fetchData();
};

/**
 * 每页展示条数切换
 */
const handlePageSizeChange = (pageSize: number) => {
    pagination.current = 1;
    pagination.pageSize = pageSize;
    fetchData();
};

// ==========================================
// 5. 列可见性持久化管理
// ==========================================

/**
 * 从 localStorage 读取该表格的列配置
 */
const loadColumnVisibilityFromCache = () => {
    if (!props.cacheKey) return null;

    try {
        const cacheKey = `PRO_TABLE_COLUMNS_${props.cacheKey}`;
        const cached = localStorage.getItem(cacheKey);
        return cached ? JSON.parse(cached) : null;
    } catch (e) {
        console.warn('[ProTable] 读取列配置缓存失败:', e);
        return null;
    }
};

/**
 * 将列配置保存到 localStorage
 */
const saveColumnVisibilityToCache = (visibility: Record<string, boolean>) => {
    if (!props.cacheKey) return;

    try {
        const cacheKey = `PRO_TABLE_COLUMNS_${props.cacheKey}`;
        localStorage.setItem(cacheKey, JSON.stringify(visibility));
    } catch (e) {
        console.warn('[ProTable] 保存列配置缓存失败:', e);
    }
};

/**
 * 初始化列配置：读缓存 -> 落地 visible 标记
 */
const initializeColumns = () => {
    const cachedVisibility = loadColumnVisibilityFromCache();

    currentColumns.value = props.columns.map(col => ({
        ...(col as ColumnWithVisibility),
        visible: cachedVisibility?.[col.dataIndex as string] !== false
    }));
};

/**
 * 重置列配置到初始状态（所有列可见）
 */
const resetColumnsToDefault = () => {
    currentColumns.value = props.columns.map(col => ({
        ...(col as ColumnWithVisibility),
        visible: true
    }));

    const visibility: Record<string, boolean> = {};
    props.columns.forEach(col => {
        visibility[col.dataIndex as string] = true;
    });
    saveColumnVisibilityToCache(visibility);
};

/**
 * 处理列可见性更新
 */
const handleColumnVisibilityChange = (checked: (string | number)[]) => {
    currentColumns.value.forEach(col => {
        col.visible = checked.includes(col.dataIndex as string | number);
    });

    // 同步保存到缓存
    const visibility: Record<string, boolean> = {};
    currentColumns.value.forEach(col => {
        visibility[col.dataIndex as string] = col.visible ?? true;
    });
    saveColumnVisibilityToCache(visibility);
};

// ==========================================
// 6. 生命周期钩子
// ==========================================
onMounted(() => {
    // 初始化列配置
    initializeColumns();
    // 组件初次渲染自动执行首次查询取数
    fetchData();
});
</script>

<style scoped>
.rongshiyi-pro-table {
    background: var(--color-bg-2);
    /* 兼容 Arco 暗色模式的基础背景配置 */
    padding: 16px;
    border-radius: 4px;
}

.pro-table-toolbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 12px;
    gap: 8px;
}

.pro-table-search {
    margin-bottom: 16px;
}

.search-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    /* 将查询按钮靠右对齐 */
}

.pro-table-setting-panel {
    min-width: 240px;
    max-height: 400px;
    overflow-y: auto;
    padding: 8px 0;
}

.setting-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 0 8px;
}

.setting-content :deep(.arco-checkbox) {
    display: flex;
    width: 100%;
    padding: 4px 0;
}

.setting-actions {
    display: flex;
    justify-content: center;
    padding: 0 8px;
}

.pro-table-image-preview-wrap {
    position: relative;
    display: inline-flex;
    border-radius: 4px;
    overflow: hidden;
    cursor: pointer;
}

.pro-table-image-preview-mask {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity .2s ease;
}

.pro-table-image-preview-wrap:hover .pro-table-image-preview-mask {
    opacity: 1;
}

.pro-table-image-preview-icon {
    color: #fff;
    font-size: 16px;
}
</style>
