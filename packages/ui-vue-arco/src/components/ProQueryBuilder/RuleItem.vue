<template>
  <div class="pro-query-item-row" :class="{ 'is-readonly': readonly }">
    <!-- Readonly 模式展示 -->
    <template v-if="readonly">
      <div class="pro-query-item-readonly" style="display: flex; align-items: center; gap: 12px;">
        <a-tag color="arcoblue" size="medium" class="readonly-field" style="font-weight: bold;">
          {{ getFieldLabel }}
        </a-tag>
        <span class="readonly-operator" style="color: var(--color-text-2); font-size: 14px;">
          {{ getOperatorLabel }}
        </span>
        <a-tag color="green" size="medium" class="readonly-value" v-if="getValueLabel">
          {{ getValueLabel }}
        </a-tag>
      </div>
    </template>

    <!-- 编辑模式展示 -->
    <template v-else>
      <!-- 字段级联选择 -->
    <a-cascader
      v-model="localItem.field"
      :options="fieldOptions"
      path-mode
      placeholder="请选择"
      expand-trigger="hover"
      @change="onFieldChange"
      :style="{ width: '220px' }"
      :error="isFieldError"
    />

    <!-- 动态操作符 -->
    <a-select 
      v-model="localItem.operator" 
      :options="operatorOptions"
      @change="onOperatorChange"
      placeholder="操作符" 
      :style="{ width: '130px' }"
      :fallback-option="false"
      :error="isOperatorError"
    />

    <!-- 动态值输入区 -->
    <div class="dynamic-val-input" :style="{ flex: 1, minWidth: '240px' }">
      <!-- 判空 -->
      <template v-if="localItem.operator === 'empty'">
        <a-radio-group v-model="localItem.value" type="button" @change="notifyChange">
          <a-radio :value="true">是</a-radio>
          <a-radio :value="false">否</a-radio>
        </a-radio-group>
      </template>

      <!-- 数字 -->
      <template v-else-if="localItem.fieldType === 'NUMBER'">
        <template v-if="localItem.operator === 'between'">
          <a-space>
            <a-input-number v-model="localItem.value[0]" @change="notifyChange" placeholder="最小值" :error="localItem.value[0] == null" />
            <span>-</span>
            <a-input-number v-model="localItem.value[1]" @change="notifyChange" placeholder="最大值" :error="localItem.value[1] == null" />
          </a-space>
        </template>
        <template v-else>
          <a-input-number v-model="localItem.value" @change="notifyChange" placeholder="请输入数值" :error="isValueError" />
        </template>
      </template>

      <!-- 日期 -->
      <template v-else-if="localItem.fieldType === 'DATE'">
        <template v-if="localItem.operator === 'af' || localItem.operator === 'bf'">
           <a-space>
             <a-select v-model="relativeTime.prefix" @change="onRelativeChange" :style="{width: '80px'}">
               <a-option value="+">未来</a-option>
               <a-option value="-">过去</a-option>
             </a-select>
             <a-input-number v-model="relativeTime.num" @change="onRelativeChange" :min="1" :style="{width: '100px'}" :error="!relativeTime.num" />
             <a-select v-model="relativeTime.unit" @change="onRelativeChange" :style="{width: '80px'}">
               <a-option value="d">日</a-option>
               <a-option value="M">月</a-option>
               <a-option value="y">年</a-option>
             </a-select>
           </a-space>
        </template>
        <template v-else-if="localItem.operator === 'between'">
          <a-range-picker v-model="localItem.value" @change="notifyChange" :style="{width: '240px'}" :error="isValueError" />
        </template>
        <template v-else>
          <a-date-picker v-model="localItem.value" @change="notifyChange" :style="{width: '180px'}" :error="isValueError" />
        </template>
      </template>

      <!-- 字典 -->
      <template v-else-if="localItem.fieldType === 'DICT'">
        <template v-if="localItem.operator === 'in'">
           <a-select v-model="localItem.value" :options="dictOptions" multiple placeholder="请多选" @change="notifyChange" :error="isValueError" />
        </template>
        <template v-else>
           <a-select v-model="localItem.value" :options="dictOptions" placeholder="请选择" @change="notifyChange" :error="isValueError" />
        </template>
      </template>

      <!-- 字符串默认 -->
      <template v-else>
        <a-input v-model="localItem.value" placeholder="请输入内容" @change="notifyChange" :error="isValueError" />
      </template>
    </div>

      <!-- 动作栏 -->
      <div class="pro-query-item-actions">
        <a-button type="text" shape="circle" @click="$emit('add-sibling')">
          <template #icon><icon-plus /></template>
        </a-button>
        <a-button type="text" shape="circle" status="danger" @click="$emit('remove')">
          <template #icon><icon-delete /></template>
        </a-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, PropType } from 'vue';
import { RuleItem as RuleItemType, FieldOption, operatorMap } from './types';

const props = defineProps({
  modelValue: {
    type: Object as PropType<RuleItemType>,
    required: true,
  },
  fieldOptions: {
    type: Array as PropType<FieldOption[]>,
    default: () => [],
  },
  readonly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'remove', 'add-sibling']);
const localItem = ref<RuleItemType>(JSON.parse(JSON.stringify(props.modelValue)));

watch(() => props.modelValue, (newVal) => {
  localItem.value = JSON.parse(JSON.stringify(newVal));
}, { deep: true });

const notifyChange = () => {
  emit('update:modelValue', localItem.value);
};

// ========================
// 表单校验逻辑
// ========================
const isFieldError = computed(() => !localItem.value.field || localItem.value.field.length === 0);
const isOperatorError = computed(() => !localItem.value.operator);
const isValueError = computed(() => {
  const { operator, value } = localItem.value;
  // empty 操作符不校验值
  if (operator === 'empty') return false; 
  // between 操作符要求是一个长度为2的非空数组
  if (operator === 'between') return !value || value.length !== 2 || value[0] == null || value[1] == null || value[0] === '' || value[1] === '';
  // in 操作符要求是一个非空数组
  if (operator === 'in') return !value || value.length === 0;
  // 特殊复合选择时间
  if (operator === 'af' || operator === 'bf') return !relativeTime.num;
  // 其他常规必填判断
  return value == null || value === '';
});

// ========================
// 查看模式计算逻辑
// ========================
const getFieldLabel = computed(() => {
  if (!localItem.value.field || localItem.value.field.length === 0) return '未选字段';
  let currentOptions = props.fieldOptions;
  const labels = [];
  for (const key of localItem.value.field) {
    const found = currentOptions.find(o => o.value === key);
    if (found) {
      labels.push(found.label);
      currentOptions = found.children || [];
    }
  }
  return labels.join(' / ');
});

const getOperatorLabel = computed(() => {
  const ops = operatorMap[localItem.value.fieldType] || operatorMap['TEXT'];
  const found = ops.find(o => o.value === localItem.value.operator);
  return found ? found.label : localItem.value.operator;
});

const getValueLabel = computed(() => {
  const { operator, value, fieldType } = localItem.value;
  if (operator === 'empty') return value ? '是' : '否';
  if (value == null || value === '') return '';
  
  if (fieldType === 'DATE' && (operator === 'af' || operator === 'bf')) {
     const p = relativeTime.prefix === '+' ? '未来' : '过去';
     const u = relativeTime.unit === 'd' ? '天' : (relativeTime.unit === 'M' ? '月' : '年');
     return `${p} ${relativeTime.num} ${u}`;
  }
  
  if (Array.isArray(value)) {
    if (operator === 'between') {
      return `${value[0]} 到 ${value[1]}`;
    }
    if (fieldType === 'DICT' && operator === 'in') {
      return value.map(v => dictOptions.find(d => d.value === v)?.label || v).join(', ');
    }
    return value.join(', ');
  }
  
  if (fieldType === 'DICT') {
    return dictOptions.find(d => d.value === value)?.label || value;
  }
  
  return String(value);
});

// 辅助函数：根据层级路径查找到真正的叶子节点 type
const findFieldMeta = (path: string[], options: FieldOption[]): FieldOption | null => {
  if (!path || !path.length) return null;
  let currentOptions = options;
  let result = null;
  for (const key of path) {
    const found = currentOptions.find(o => o.value === key);
    if (!found) return null;
    result = found;
    currentOptions = found.children || [];
  }
  return result;
};

const onFieldChange = (value: (string | number)[]) => {
  const selectedPath = value as string[];
  const fieldMeta = findFieldMeta(selectedPath, props.fieldOptions);
  
  if (fieldMeta && fieldMeta.type) {
    localItem.value.fieldType = fieldMeta.type;
    const ops = operatorMap[fieldMeta.type];
    // 当前操作符如果不属于新类型的映射则重置此操作符
    if (ops && !ops.find(o => o.value === localItem.value.operator)) {
      localItem.value.operator = ops[0].value;
    }
  } else {
    localItem.value.fieldType = 'TEXT';
  }
  
  resetValueByOperator();
  notifyChange();
};

const operatorOptions = computed(() => {
  return operatorMap[localItem.value.fieldType] || operatorMap['TEXT'];
});

const resetValueByOperator = () => {
  const op = localItem.value.operator;
  if (op === 'between') {
    localItem.value.value = [];
  } else if (op === 'empty') {
    localItem.value.value = true;
  } else if (op === 'in') {
    localItem.value.value = [];
  } else {
    localItem.value.value = null;
  }
};

const onOperatorChange = () => {
  resetValueByOperator();
  notifyChange();
};

// 后台模拟或注入的字段字典项
const dictOptions = [
  { value: 'admin', label: '管理员' },
  { value: 'user', label: '普通用户' },
  { value: 'vip', label: '大会员' }
];

/** 复合相对配置 (例如未来7天 '+7d') */
const relativeTime = reactive({ prefix: '+', num: 1, unit: 'd' });
if (['af', 'bf'].includes(localItem.value.operator) && typeof localItem.value.value === 'string') {
  const match = localItem.value.value.match(/^([+-])(\d+)([dMy])$/);
  if (match) {
    relativeTime.prefix = match[1];
    relativeTime.num = Number(match[2]);
    relativeTime.unit = match[3];
  }
}
const onRelativeChange = () => {
  localItem.value.value = `${relativeTime.prefix}${relativeTime.num}${relativeTime.unit}`;
  notifyChange();
};
</script>
