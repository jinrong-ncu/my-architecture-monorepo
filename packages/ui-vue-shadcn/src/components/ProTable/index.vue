<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <div class="flex justify-end gap-2" v-if="props.showSetting !== false">
      <Popover>
        <PopoverTrigger as-child>
          <Button variant="outline" size="sm" class="h-8">
            <Settings class="mr-2 h-4 w-4" />
            列设置
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-56" align="end">
          <div class="space-y-4">
            <div class="space-y-2" v-if="currentColumns.length > 0">
              <div v-for="col in currentColumns" :key="col.dataIndex" class="flex items-center space-x-2">
                <Checkbox 
                  :id="col.dataIndex" 
                  :checked="col.visible !== false"
                  @update:checked="(val: boolean) => toggleColumnVisibility(col.dataIndex, val)"
                />
                <label :for="col.dataIndex" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {{ col.title }}
                </label>
              </div>
            </div>
            <div v-else class="text-xs text-muted-foreground text-center py-4">
               暂无可配置列
            </div>
            <div class="h-px bg-border my-2 block" v-if="currentColumns.length > 0"></div>
            <Button variant="ghost" size="sm" class="w-full h-8" @click="resetColumnsToDefault" v-if="currentColumns.length > 0">
              重置默认
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>

    <!-- Search Form -->
    <div v-if="searchColumns.length > 0" class="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div v-for="col in searchColumns" :key="col.dataIndex" class="space-y-2">
          <label class="text-sm font-medium leading-none">{{ col.title }}</label>
          <template v-if="col.valueType === 'select'">
            <Select v-model="searchModel[col.dataIndex as string]">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="请选择" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in col.options" :key="opt.value" :value="String(opt.value)">
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </template>
          <template v-else>
            <Input v-model="searchModel[col.dataIndex as string]" placeholder="请输入" class="w-full" />
          </template>
        </div>
        
        <!-- Actions -->
        <div class="flex items-end space-x-2">
          <Button @click="handleSearch">查询</Button>
          <Button variant="outline" @click="handleReset">重置</Button>
        </div>
      </div>
    </div>

    <!-- Table Content -->
    <div class="rounded-md border bg-card relative">
      <div v-if="loading" class="absolute inset-0 z-20 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-md">
        <Loader2 class="h-8 w-8 animate-spin text-primary" />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead v-for="col in displayColumns" :key="col.dataIndex" :class="getAlignClass(col.align)" :style="{ width: typeof col.width === 'number' ? col.width + 'px' : col.width }">
              <div :class="['flex items-center gap-1', getAlignFlexClass(col.align)]">
                <span>{{ col.title }}</span>
                <HelpCircle v-if="col.tooltip" class="h-4 w-4 text-muted-foreground" :title="col.tooltip" />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="(record, rowIndex) in tableData" :key="rowIndex">
            <TableCell v-for="col in displayColumns" :key="col.dataIndex" :class="getAlignClass(col.align)">
              <!-- Slot Interception -->
              <slot v-if="col.slotName && $slots[col.slotName as string]" :name="col.slotName" :column="col" :record="record" :rowIndex="rowIndex" />
              <template v-else>
                <!-- Types mapping -->
                <template v-if="col.valueType === 'slot'">
                  <slot :name="col.componentSlot || col.slotName" :record="record" :column="col" :rowIndex="rowIndex" />
                </template>

                <template v-else-if="col.valueType === 'image'">
                  <div v-if="getImageList(record[col.dataIndex || '']).length > 0" class="group relative inline-flex rounded-md overflow-hidden cursor-pointer h-10 w-10 border">
                    <img :src="getImageList(record[col.dataIndex || ''])[0]" class="object-cover w-full h-full" />
                    <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye class="text-white h-4 w-4" />
                    </div>
                  </div>
                  <span v-else class="text-muted-foreground text-sm">暂无图标</span>
                </template>

                <template v-else-if="col.valueType === 'html'">
                  <span v-html="record[col.dataIndex || '']" class="text-sm"></span>
                </template>

                <template v-else-if="col.valueType === 'switch'">
                  <Switch 
                     :checked="record[col.dataIndex || ''] === (col.switchConfig?.activeValue ?? true)"
                     :disabled="col.switchConfig?.disabled?.(record)"
                     @update:checked="(val: boolean) => handleSwitch(val, record, col)" 
                  />
                </template>

                <template v-else-if="col.valueType === 'enum' || col.valueType === 'select'">
                  <!-- Use Badge for enum display naturally in shadcn -->
                  <Badge variant="secondary" class="rounded-sm font-normal">
                    {{ getEnumLabel(record[col.dataIndex || ''], col.options) }}
                  </Badge>
                </template>

                <template v-else-if="col.valueType === 'array'">
                  <span class="text-sm">{{ formatArray(record[col.dataIndex || '']) }}</span>
                </template>

                <template v-else-if="col.valueType === 'operation'">
                  <div class="flex items-center gap-2">
                    <template v-for="(btn, btnIdx) in getVisibleOperations(col.operation)" :key="btnIdx">
                      <Button variant="ghost" size="sm" class="h-8 px-2" :disabled="btn.disabled?.(record)" @click="btn.onClick(record)">
                        <component :is="btn.icon" v-if="btn.icon" class="mr-1 h-3.5 w-3.5" />
                        {{ btn.label }}
                      </Button>
                    </template>
                    <DropdownMenu v-if="getDropdownOperations(col.operation).length > 0">
                      <DropdownMenuTrigger as-child>
                        <Button variant="ghost" size="icon" class="h-8 w-8">
                          <MoreHorizontal class="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem v-for="(btn, btnIdx) in getDropdownOperations(col.operation)" :key="btnIdx" :disabled="btn.disabled?.(record)" @click="btn.onClick(record)">
                          <component :is="btn.icon" v-if="btn.icon" class="mr-2 h-4 w-4" />
                          <span>{{ btn.label }}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </template>

                <template v-else>
                  <span class="text-sm">{{ record[col.dataIndex || ''] }}</span>
                  <button v-if="col.copyable && record[col.dataIndex || '']" @click="handleCopy(record[col.dataIndex || ''])" class="ml-1.5 align-middle text-muted-foreground hover:text-foreground transition-colors">
                    <Copy class="h-3.5 w-3.5" />
                  </button>
                </template>
              </template>
            </TableCell>
          </TableRow>
          
          <TableRow v-if="tableData.length === 0">
            <TableCell :colspan="displayColumns.length" class="h-24 text-center">
              暂无数据
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      
      <div class="px-4 py-3 border-t flex items-center justify-between" v-if="pagination.total > 0">
        <div class="text-sm text-muted-foreground">
          共 {{ pagination.total }} 条记录
        </div>
        <Pagination :total="pagination.total" :page="pagination.current" :items-per-page="pagination.pageSize" @update:page="handlePageChange">
          <div class="flex items-center gap-1">
             <PaginationFirst @click="handlePageChange(1)" />
             <PaginationPrevious @click="pagination.current > 1 && handlePageChange(pagination.current - 1)" />
             <template v-for="p in Math.ceil(pagination.total / pagination.pageSize)" :key="p">
               <Button class="w-9 h-9 p-0" :variant="p === pagination.current ? 'default' : 'outline'" @click="handlePageChange(p)" v-if="Math.abs(p - pagination.current) <= 2 || p === 1 || p === Math.ceil(pagination.total / pagination.pageSize)">
                 {{ p }}
               </Button>
               <span v-else-if="Math.abs(p - pagination.current) === 3" class="w-9 h-9 flex items-center justify-center text-muted-foreground">...</span>
             </template>
             <PaginationNext @click="pagination.current < Math.ceil(pagination.total / pagination.pageSize) && handlePageChange(pagination.current + 1)" />
             <PaginationLast @click="handlePageChange(Math.ceil(pagination.total / pagination.pageSize))" />
          </div>
        </Pagination>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import type { ProTableProps, ProColumnData } from './types';
import { Settings, Copy, HelpCircle, Eye, MoreHorizontal, Loader2, Image as ImageIcon } from 'lucide-vue-next';

// Shadcn primitives
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Pagination, PaginationFirst, PaginationLast, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface ColumnWithVisibility extends ProColumnData {
  visible?: boolean;
}

const props = defineProps<ProTableProps>();

const loading = ref(false);
const tableData = ref<any[]>([]);
const searchModel = reactive<Record<string, any>>({});
const currentColumns = ref<ColumnWithVisibility[]>([]);

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
});

const searchColumns = computed(() => {
  return props.columns.filter(col => col.search === true);
});

const displayColumns = computed(() => {
  return currentColumns.value.filter(col => col.visible !== false).map(col => {
    const needsCustomRender = col.valueType || col.copyable;
    if (needsCustomRender && !col.slotName) {
      return { ...col, slotName: col.dataIndex };
    }
    return col;
  });
});

const getAlignClass = (align?: string) => {
  if (align === 'center') return 'text-center';
  if (align === 'right') return 'text-right';
  return 'text-left';
};

const getAlignFlexClass = (align?: string) => {
  if (align === 'center') return 'justify-center';
  if (align === 'right') return 'justify-end';
  return 'justify-start';
};

const getEnumLabel = (val: any, options?: any[]) => {
  if (!options) return String(val);
  const hit = options.find(opt => String(opt.value) === String(val));
  return hit ? hit.label : String(val);
};

const formatArray = (val: any) => {
  if (Array.isArray(val)) return val.join(', ');
  return String(val || '');
};

const getImageList = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(i => typeof i === 'string');
  if (typeof value === 'string') return [value];
  return [];
};

const getVisibleOperations = (operations?: any[]) => {
  if (!operations) return [];
  if (operations.length <= 3) return operations;
  return operations.slice(0, 2);
};

const getDropdownOperations = (operations?: any[]) => {
  if (!operations || operations.length <= 3) return [];
  return operations.slice(2);
};

const handleCopy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(String(text));
    alert('已成功复制内容: ' + text);
  } catch (err) {
    console.error('Copy failed', err);
  }
};

const handleSwitch = (val: boolean, record: any, col: ProColumnData) => {
  const activeVal = col.switchConfig?.activeValue ?? true;
  const inactiveVal = col.switchConfig?.inactiveValue ?? false;
  record[col.dataIndex || ''] = val ? activeVal : inactiveVal;
  col.switchConfig?.onChange?.(record[col.dataIndex || ''], record);
};

// Data Actions
const fetchData = async () => {
  if (!props.requestApi) return;
  loading.value = true;
  try {
    const params = { page: pagination.current, pageSize: pagination.pageSize, ...searchModel };
    const { data, total } = await props.requestApi(params);
    tableData.value = data || [];
    pagination.total = total || 0;
  } catch (err) {
    console.error('ProTable Request Failed:', err);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.current = 1;
  fetchData();
};

const handleReset = () => {
  Object.keys(searchModel).forEach(key => searchModel[key] = undefined);
  handleSearch();
};

const handlePageChange = (page: number) => {
  if (page === pagination.current) return;
  pagination.current = page;
  fetchData();
};

// Column Visibility Persistence
const toggleColumnVisibility = (dataIndex?: string, visible?: boolean) => {
  if (!dataIndex) return;
  const col = currentColumns.value.find(c => c.dataIndex === dataIndex);
  if (col) col.visible = visible;
  saveColumnVisibilityToCache();
};

const saveColumnVisibilityToCache = () => {
  if (!props.cacheKey) return;
  const visibility: Record<string, boolean> = {};
  currentColumns.value.forEach(col => visibility[col.dataIndex as string] = col.visible ?? true);
  localStorage.setItem(`PRO_TABLE_COLUMNS_${props.cacheKey}`, JSON.stringify(visibility));
};

const loadColumnVisibilityFromCache = () => {
  if (!props.cacheKey) return null;
  try {
    const cached = localStorage.getItem(`PRO_TABLE_COLUMNS_${props.cacheKey}`);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const initializeColumns = () => {
  const cachedVisibility = loadColumnVisibilityFromCache();
  currentColumns.value = props.columns.map(col => ({
    ...col,
    visible: cachedVisibility?.[col.dataIndex as string] !== false
  }));
};

const resetColumnsToDefault = () => {
  currentColumns.value.forEach(col => col.visible = true);
  saveColumnVisibilityToCache();
};

onMounted(() => {
  initializeColumns();
  fetchData();
});
</script>
