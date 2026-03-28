<template>
  <div class="pro-query-group">
    <!-- 图形化逻辑边框及其上的串联组切按键 (且/或) -->
    <div class="pro-query-group-bracket" :class="{ 'is-single': localGroup.children.length <= 1 }">
      <div class="pro-query-relation-btn" v-if="localGroup.children.length > 1">
        <a-button type="primary" size="small" @click="!readonly && toggleRelation()" :style="readonly ? { cursor: 'default' } : {}" :class="readonly ? 'readonly-relation' : ''">
          {{ localGroup.relation === 'AND' ? '且' : '或' }}
        </a-button>
      </div>
    </div>
    
    <div class="pro-query-group-children">
      <!-- 渲染每一行的节点 (包括 Item 节点和深层 Group 节点) -->
      <div class="pro-query-child-wrapper" v-for="(child, index) in localGroup.children" :key="child.id">
        <RuleGroup
          v-if="child.type === 'group'"
          :modelValue="child"
          :fieldOptions="fieldOptions"
          :readonly="readonly"
          @update:modelValue="(val) => updateChild(index, val)"
          @remove="() => removeChild(index)"
        />
        <RuleItem
          v-else
          :modelValue="child"
          :fieldOptions="fieldOptions"
          :readonly="readonly"
          @update:modelValue="(val) => updateChild(index, val)"
          @remove="() => removeChild(index)"
          @add-sibling="() => addSibling(index)"
        />
      </div>
      
      <!-- 此级层底部动作 -->
      <div class="pro-query-group-actions" v-if="!readonly">
        <a-button type="outline" size="small" @click="addCondition">
          <template #icon><icon-plus /></template>增加条件
        </a-button>
        <a-button type="outline" size="small" @click="addGroup">
          <template #icon><icon-folder-add /></template>增加条件组
        </a-button>
        <a-button type="outline" status="danger" size="small" v-if="!isRoot" @click="$emit('remove')">
          <template #icon><icon-delete /></template>删除当前组
        </a-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// Vue 3 需要声明 name 以供自己组件中自递归调用自身
export default {
  name: 'RuleGroup'
}
</script>

<script setup lang="ts">
import { ref, watch, PropType } from 'vue';
import type { RuleGroup as RuleGroupType, FieldOption } from './types';
import RuleItem from './RuleItem.vue';

const props = defineProps({
  modelValue: {
    type: Object as PropType<RuleGroupType>,
    required: true,
  },
  fieldOptions: {
    type: Array as PropType<FieldOption[]>,
    default: () => [],
  },
  isRoot: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'remove']);
const localGroup = ref<RuleGroupType>(JSON.parse(JSON.stringify(props.modelValue)));

watch(() => props.modelValue, (newVal) => {
  localGroup.value = JSON.parse(JSON.stringify(newVal));
}, { deep: true });

const notifyChange = () => {
  emit('update:modelValue', localGroup.value);
};

const toggleRelation = () => {
  localGroup.value.relation = localGroup.value.relation === 'AND' ? 'OR' : 'AND';
  notifyChange();
};

const generateId = () => Math.random().toString(36).substr(2, 9);

const updateChild = (index: number, val: any) => {
  localGroup.value.children[index] = val;
  notifyChange();
};

const removeChild = (index: number) => {
  localGroup.value.children.splice(index, 1);
  notifyChange();
};

const getDefaultItem = () => ({
  id: generateId(),
  type: 'item' as const,
  field: [],
  operator: 'eq',
  value: null,
  fieldType: 'TEXT' as const
});

const addCondition = () => {
  localGroup.value.children.push(getDefaultItem());
  notifyChange();
};

const addSibling = (index: number) => {
  localGroup.value.children.splice(index + 1, 0, getDefaultItem());
  notifyChange();
};

const addGroup = () => {
  localGroup.value.children.push({
    id: generateId(),
    type: 'group',
    relation: 'AND',
    children: [getDefaultItem()]
  });
  notifyChange();
};
</script>
