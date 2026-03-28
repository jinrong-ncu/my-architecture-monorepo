import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // 在开发沙盒中，强制将 @ 指向 ui 包的 src 目录，这样直接引入未经编译的 ui-vue-shadcn 源码时就能解析 Shadcn 的内置原子件
      '@': path.resolve(__dirname, '../../packages/ui-vue-shadcn/src'),
    },
  },
})
