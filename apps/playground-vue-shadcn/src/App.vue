<script setup lang="ts">
import { ref } from 'vue';
import { ProForm, ProTable } from 'rongshiyi-ui-vue-shadcn';
import type { ProColumnData, FormItemConfig } from 'rongshiyi-ui-vue-shadcn';

const columns: ProColumnData[] = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '名称', dataIndex: 'name', search: true },
  { title: '角色', dataIndex: 'role', valueType: 'enum', search: true, options: [{ label: '管理员', value: 'admin' }, { label: '访客', value: 'guest' }] },
  { title: '状态', dataIndex: 'status', valueType: 'switch', switchConfig: { activeValue: 1, inactiveValue: 0 } },
  { title: '操作', dataIndex: 'op', valueType: 'operation', operation: [{ label: '编辑', onClick: (r) => alert('edit '+r.name) }] }
];

const mockRequest = async (params: any) => {
   console.log('Fetching', params);
   return new Promise((resolve: (val: any) => void) => {
     setTimeout(() => {
        resolve({
           data: [
             { id: 1, name: 'Alice', role: 'admin', status: 1 },
             { id: 2, name: 'Bob', role: 'guest', status: 0 },
             { id: 3, name: 'Charlie', role: 'guest', status: 1 },
           ],
           total: 3
        });
     }, 600);
   });
};

const formItems: FormItemConfig[] = [
  { name: 'username', label: '用户名', component: 'input', rules: [{ required: true, message: '必填' }] },
  { name: 'role', label: '开通角色', component: 'select', options: { items: [{ label: 'Admin', value: 'admin' }] } },
  { name: 'notify', label: '接收通知', component: 'switch' }
];

const formData = ref({});
</script>

<template>
  <div class="p-8 space-y-12 max-w-5xl mx-auto dark">
    <div>
       <h2 class="text-2xl font-bold mb-6 tracking-tight">ProForm (Shadcn-Vue 版)</h2>
       <div class="border rounded-lg p-6 bg-card text-card-foreground shadow-sm">
         <ProForm :items="formItems" v-model="formData" @submit="console.log(formData)" />
       </div>
    </div>

    <div>
       <h2 class="text-2xl font-bold mb-6 tracking-tight">ProTable (Shadcn-Vue 版)</h2>
       <ProTable :columns="columns" :requestApi="mockRequest" cacheKey="shadcn-test" />
    </div>
  </div>
</template>
