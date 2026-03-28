# RongShiYi Architecture Monorepo 🚀

企业级高级跨端UI基建架构的 Monorepo 工程，致力于为基于 React 与 Vue 的不同体系提供统一的开发、构建与测试解决方案。

## 📦 项目结构

本项目使用 [pnpm workspaces](https://pnpm.io/workspaces) 和 [Turborepo](https://turbo.build/) 进行多包（Mono-repository）管理。

### 🧩 核心包库 (Packages)

位于 `packages/` 目录下，主要提供跨端组件以及底层构建工具：

- **`@rongshiyi/cli`**: 内部研发辅助使用的脚手架与自动化脚本工具。
- **`@rongshiyi/core`**: 提供框架无关的核心业务逻辑、Hook 函数或者公共的 Utility 函数。
- **`rongshiyi-ui-vue-arco`**: 基于 Vue 3 + Arco Design 封装的高级业务组件库（如 `ProTable`, `ProForm`, 等）。
- **`rongshiyi-ui-react-antd`**: 基于 React 18 + Ant Design 封装的高级业务组件库。
- **`rongshiyi-ui-vue-shadcn`**: 全新的基于 Vue 3 + TailwindCSS + shadcn-vue 架构打造的高定组件库。
- **`rongshiyi-ui-react-shadcn`**: 全新的基于 React 18 + TailwindCSS + shadcn-ui 架构打造的高定组件库。

### 🎮 测试沙箱 (Apps)

位于 `apps/` 目录下，为包库提供直观和隔离的开发调试环境：

- **`playground-vue-arco`**: `rongshiyi-ui-vue-arco` 的沉浸式开发测试沙箱（基于 Vite + Vue3）。
- **`playground-react-antd`**: `rongshiyi-ui-react-antd` 的测试开发沙箱（基于 Vite + React）。
- **`playground-vue-shadcn`**: `rongshiyi-ui-vue-shadcn` 的 Tailwind 专属测试沙箱。
- **`playground-react-shadcn`**: `rongshiyi-ui-react-shadcn` 的 Tailwind 专属测试沙箱。

---

## 🛠️ 技术栈与生态要求

- **包管理器**：`pnpm` (推荐使用版本 >= 8.x)
- **构建编排**：`Turborepo` (极速的多线程增量构建)
- **开发工具链**：`Vite` / `TypeScript`
- **样式方案**：`TailwindCSS` / 原生框架自带设计系统变量
- **代码规范**：`ESLint` + `Prettier` + `Husky` 强拦截自动化体系

---

## 🏃 快速开始 (Quick Start)

### 1. 配置与安装
请在项目根目录下利用 pnpm 进行依赖拉取（注意：**绝不要在某个子目录下执行 yarn**，因普通 yarn 无法原生识别 workspace 通配协议）。

```bash
# 进入根目录
cd your-path/my-architecture-monorepo

# 使用 pnpm 一键同步和串联所有的依赖关系
pnpm install
```

### 2. 启动开发沙箱 (Dev Playgrounds)

借助 turborepo 或 pnpm 的 `--filter` 参数，你可以随时起调任意一个所需子项目：

```bash
# 举例 1：启动 Vue + Arco 设计研发沙箱
pnpm run dev --filter @rong/playground-vue-arco

# 举例 2：启动 React + Antd 研发沙箱
pnpm run dev --filter @rongshiyi/playground-react-antd

# 举例 3：启动最新的 Vue Shadcn UI 测试层
pnpm run dev --filter @rongshiyi/playground-vue-shadcn
```

*(也可以根据 `pnpm-workspace.yaml` 直接进入 `apps/对应的文件夹` 目录下键入 `pnpm dev`)*

### 3. 一键编译所有包 (Build all)

```bash
pnpm build
```

通过 Turborepo 可进行所有关联模块的拓扑排序、拓扑编译并缓存，从而使得未来的二次编译速度飞跃。

---

## 🤝 开发准则
- 所有新增跨工程组件务必写入对应的 `packages` 目录，并于对应的 `apps` 提供沙盒文档或实例展示。
- 各个生态的UI开发需严格保持依赖独立，禁止引入对方生态中独享的 Hooks 和配置（例如 React 不使用 Vue reactivity）。
- 项目遵守 `pnpm workspace` 结构限制，新模块创立时请确认添加对应的包含规则到根基建中。
