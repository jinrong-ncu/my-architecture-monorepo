<template>
  <n-message-provider>
    <div style="padding: 20px;">
      <ProFormDemo />
    </div>
  </n-message-provider>
</template>

<script setup lang="ts">
import { NMessageProvider } from 'naive-ui';
import ProFormDemo from './views/ProFormDemo.vue';
</script>
