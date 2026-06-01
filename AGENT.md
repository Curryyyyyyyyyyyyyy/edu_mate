# AI 代码生成规范

## 项目上下文

- 本项目是 Vite + React + TypeScript 单页应用。
- 包管理器统一使用 `pnpm`，不要使用 `npm`、`yarn`，也不要生成混合锁文件。
- 路由统一放在 `src/router`。
- 页面级组件统一放在 `src/pages/<page-name>/index.tsx`。
- 静态资源和全局样式放在 `src/assets`。
- 项目已接入 Tailwind CSS v4，通过 `@tailwindcss/vite` 插件和 `src/assets/reset.css` 中的 `@import "tailwindcss";` 生效。

## Tailwind CSS 使用规范

- 编写页面和组件样式时，优先使用 Tailwind utility class。
- 不要为单个页面或组件新增普通 CSS 文件，除非 Tailwind 无法合理表达该样式。
- 全局 CSS 仅用于 reset、基础元素样式、CSS 变量、字体声明和确实全局共享的规则。
- 不要随意新增 `tailwind.config.*`。Tailwind v4 在当前项目中不需要配置文件即可工作。
- 只有在需要统一主题 token、自定义颜色、字体、断点、动画或插件时，才新增 Tailwind 配置文件。
- className 应保持可读性：按布局、尺寸、间距、颜色、状态的大致顺序组织，不要生成难以维护的超长 className。
- 响应式样式优先使用 Tailwind 断点前缀，例如 `sm:`、`md:`、`lg:`。
- 交互状态优先使用 Tailwind 状态前缀，例如 `hover:`、`focus-visible:`、`disabled:`。
- 可复用视觉模式应抽成组件，而不是复制大量相同 className。

## React 与 TypeScript 规范

- 优先编写小而清晰的 React 函数组件。
- 组件名称使用 PascalCase，变量和函数使用 camelCase。
- 使用 TypeScript 类型约束 props、数据结构和事件处理函数。
- 避免使用 `any`。只有在边界数据确实无法明确类型时，才允许临时使用，并尽快收敛类型。
- 不要引入新的 UI 框架或状态管理库，除非任务明确要求。
- 保持已有行为不变，除非当前任务要求修改。

## 路由规范

- 路由定义集中维护在 `src/router/index.tsx`。
- 页面组件从 `src/pages/<page-name>` 导入。
- 首页路径使用 `/`。
- 新增页面时，先创建 `src/pages/<page-name>/index.tsx`，再在路由表中注册。

## 文件组织规范

- 每个页面一个目录，例如 `src/pages/home/index.tsx`。
- 页面目录内只放该页面强相关代码。
- 多页面复用的组件应抽到共享组件目录，不要重复复制。
- 不做与任务无关的重构、重命名或格式 churn。

## 包管理与命令

- 安装运行时依赖：

```bash
pnpm add <package>
```

- 安装开发依赖：

```bash
pnpm add -D <package>
```

- 完成代码修改后验证：

```bash
pnpm run lint
pnpm run build
```

## AI 输出要求

- 生成的代码必须能直接运行，不要留下缺失导入、伪代码或占位文件。
- 修改范围应聚焦当前需求。
- 如果修改了依赖、路由、构建配置或全局样式，最终回复中要简要说明。
- 如果验证命令无法执行或失败，需要说明失败原因和当前风险。
