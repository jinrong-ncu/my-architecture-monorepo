<template>
  <div class="query-builder-demo" style="padding: 24px; background: #fff; min-height: 100vh;">
    <h2 style="margin-bottom: 24px;">ProQueryBuilder 动态逻辑过滤构造器演示</h2>
    
    <div style="margin-bottom: 24px; padding: 16px; background-color: var(--color-fill-2); border-radius: 4px; display: flex; gap: 24px; align-items: center;">
      <div>
        <span style="margin-right: 12px; font-weight: bold;">组件模式切换:</span>
        <a-radio-group v-model="isReadonly" type="button">
          <a-radio :value="false">编辑模式</a-radio>
          <a-radio :value="true">查看模式 (Readonly)</a-radio>
        </a-radio-group>
      </div>
      <div>
        <a-button type="primary" @click="handleValidate">
          <template #icon><icon-check /></template>
          全局校验拦截测试
        </a-button>
      </div>
    </div>

    <div style="max-width: 1000px">
        <ProQueryBuilder 
            v-model="query" 
            :fieldOptions="mockFieldOptions" 
            :readonly="isReadonly"
        />
    </div>

    <div style="margin-top: 40px;">
      <h3 style="margin-bottom: 16px;">当前构树产生的 AST 模型数据 (v-model实时同步)</h3>
      <div style="background: #f4f5f7; padding: 16px; border-radius: 4px; overflow: auto; max-height: 400px;">
        <pre>{{ JSON.stringify(query, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ProQueryBuilder } from 'rongshiyi-ui-vue-arco';
import type { RuleGroup, RuleItem, FieldOption } from 'rongshiyi-ui-vue-arco';
import { Message } from '@arco-design/web-vue';
import { IconCheck } from '@arco-design/web-vue/es/icon';

const isReadonly = ref(false);

// 基础 mock 字典树
const mockFieldOptions: FieldOption[] = [
  {
    value: 'user',
    label: '用户信息',
    children: [
      { value: 'name', label: '姓名', type: 'TEXT' },
      { value: 'age', label: '年龄', type: 'NUMBER' },
      { value: 'birthday', label: '生日', type: 'DATE' },
      { value: 'role', label: '角色类型', type: 'DICT' },
    ]
  },
  {
    value: 'behavior',
    label: '行为数据',
    children: [
      { value: 'loginTime', label: '最后登录时间', type: 'DATE' },
      { value: 'score', label: '活跃积分', type: 'NUMBER' }
    ]
  }
];

// 初始化一个复杂的嵌套状态
const query = ref<RuleGroup>({
  id: 'root-1',
  type: 'group',
  relation: 'AND',
  children: [
    {
      id: 'rule-1',
      type: 'item',
      field: ['user', 'name'],
      operator: 'like',
      value: '张三',
      fieldType: 'TEXT'
    },
    {
      id: 'group-2',
      type: 'group',
      relation: 'OR',
      children: [
         {
           id: 'rule-2',
           type: 'item',
           field: ['user', 'age'],
           operator: 'between',
           value: [18, 35],
           fieldType: 'NUMBER'
         },
         {
           id: 'rule-3',
           type: 'item',
           field: ['behavior', 'loginTime'],
           operator: 'bf', // 过去
           value: '-7d',   // 过去七天
           fieldType: 'DATE'
         }
      ]
    }
  ]
});

// 手工执行整树判空校验的演示
const validateAST = (node: RuleGroup | RuleItem): boolean => {
  if (node.type === 'group') {
    if (node.children.length === 0) {
      Message.warning('存在没有任何下属条件的空条件组！');
      return false;
    }
    return node.children.every(child => validateAST(child));
  } else {
    if (!node.field || node.field.length === 0) {
      Message.warning('存在漏填的条件（未选择过滤字段）');
      return false;
    }
    if (!node.operator) {
      Message.warning('存在漏填的条件（未选择操作符）');
      return false;
    }
    
    if (node.operator === 'empty') return true;
    
    if (node.operator === 'between') {
      if (!node.value || node.value.length !== 2 || node.value[0] == null || node.value[1] == null || node.value[0] === '' || node.value[1] === '') {
        Message.warning('存在不合法的区间（介于必须填写完全最小值和最大值）');
        return false;
      }
    } else if (node.operator === 'in') {
      if (!node.value || node.value.length === 0) {
        Message.warning('字典属性的属于范围至少需要选择一项');
        return false;
      }
    } else if (node.operator === 'af' || node.operator === 'bf') {
       const match = typeof node.value === 'string' && node.value.match(/^([+-])(\d+)([dMy])$/);
       if (!match || !match[2]) {
         Message.warning('相对时间输入框没填全！');
         return false;
       }
    } else {
       if (node.value == null || node.value === '') {
         Message.warning('常规值输入框存在空缺填写！');
         return false;
       }
    }
    return true;
  }
};

const handleValidate = () => {
   if (validateAST(query.value)) {
     Message.success('AST 逻辑树校验通过！可以安全发起请求啦~');
   }
};
</script>
