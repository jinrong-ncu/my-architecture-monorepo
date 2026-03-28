<template>
  <div class="pro-query-builder">
    <RuleGroup
      :modelValue="modelValue"
      :fieldOptions="fieldOptions"
      :readonly="readonly"
      @update:modelValue="handleUpdate"
      :isRoot="true"
    />
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue';
import RuleGroup from './RuleGroup.vue';
import type { RuleGroup as RuleGroupType, FieldOption } from './types';

const props = defineProps({
  modelValue: {
    type: Object as PropType<RuleGroupType>,
    required: true,
  },
  fieldOptions: {
    type: Array as PropType<FieldOption[]>,
    default: () => [],
  },
  readonly: {
    type: Boolean,
    default: false,
  }
});

const emit = defineEmits(['update:modelValue']);

const handleUpdate = (val: RuleGroupType) => {
  emit('update:modelValue', val);
};
</script>

<style>
.pro-query-builder {
  --query-border-color: var(--color-border-3);
  --query-line-width: 2px;
  --query-indent: 50px;

  font-family: inherit;

  .pro-query-group {
    display: flex;
    position: relative;
    box-sizing: border-box;
    margin-bottom: 8px;
  }

  /* 组容器的子项纵列 */
  .pro-query-group-children {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 12px;
    padding-left: var(--query-indent);
    position: relative;
  }

  /* 画出组的括号（左边框 + 上下短横线） */
  .pro-query-group-bracket {
    position: absolute;
    left: calc(var(--query-indent) * 0.5);
    /* 居中显示于缩进空间 */
    top: 20px;
    /* 对齐第一个 item 中心 */
    bottom: 20px;
    /* 对齐最后一个 item 中心 */
    width: 20px;
    border-left: var(--query-line-width) dashed var(--query-border-color);
    border-top: var(--query-line-width) dashed var(--query-border-color);
    border-bottom: var(--query-line-width) dashed var(--query-border-color);
    border-top-left-radius: 6px;
    border-bottom-left-radius: 6px;
    z-index: 1;
    pointer-events: none;
  }

  /* 当只有一个子项时，不需要上下短横线，只保留逻辑按钮位置 */
  .pro-query-group-bracket.is-single {
    border-top: none;
    border-bottom: none;
    border-radius: 0;
  }

  /* 当前组的“且/或”关系按钮 */
  .pro-query-relation-btn {
    position: absolute;
    left: -25px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    pointer-events: auto;
  }

  /* 子项包裹器，设置相对定位以便画中间项的横线 */
  .pro-query-child-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    /* 预留一点高度给连接线对齐 */
    min-height: 40px;
  }

  /* 如果不是第一项和最后一项，左侧中间需要一条横线连接主骨架 */
  .pro-query-child-wrapper:not(:first-child):not(:last-child)::before {
    content: '';
    position: absolute;
    left: calc(var(--query-indent) * -0.5);
    top: 50%;
    transform: translateY(-50%);
    width: calc(var(--query-indent) * 0.5);
    border-top: var(--query-line-width) dashed var(--query-border-color);
    z-index: 0;
    pointer-events: none;
  }

  /* 实际的规则项输入行 */
  .pro-query-item-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    background-color: var(--color-bg-1);
    border: 1px solid var(--color-border-2);
    border-radius: 6px;
    padding: 10px 16px;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--color-primary-light-3);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }
  }

  .pro-query-item-actions {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }

  .pro-query-group-actions {
    display: flex;
    gap: 16px;
    margin-top: 4px;
  }
}
</style>