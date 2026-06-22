# CLAUDE.md

本文件为 Claude Code 在本仓库中的操作提供指导。

## 构建与开发命令

### 主项目（Vite 版本）

```bash
pnpm dev          # 启动 Vite 开发服务器（端口 3000，自动打开浏览器，启用 MSW Mock）
pnpm build        # 生产构建，输出到 dist/
pnpm preview      # 预览构建产物
pnpm mock:init    # 重新初始化 MSW Service Worker
```

### 免编译版本

见下方 `nobuild/` 说明。

## 端到端验证

```bash
pnpm dev
CHROME_PATH=/path/to/chrome node scripts/verify.mjs  # 运行 Puppeteer 测试，截图保存到 verify-output/
```

## nobuild/ — 免编译纯静态版本

`nobuild/` 目录是一个脱离 Vite/npm/TypeScript 的纯静态副本，所有源码已转换为原生 JavaScript ES Module，**无需编译即可运行**。

### 与主项目的区别

| 主项目 | nobuild/ |
|--------|----------|
| TypeScript `.ts` | 原生 JavaScript `.js` |
| Vite 开发服务器 | 任意静态 HTTP 服务（`python -m http.server`） |
| Zustand 状态管理 | 手写 30 行 `createStore` |
| MSW Service Worker mock | 手写 `fetch` 拦截器 |
| Monorepo (`workspace:*`) | 扁平目录，相对路径 import |
| `package.json` / `node_modules` | 无 |

### 启动

```bash
cd nobuild && python -m http.server 8080
# 浏览器打开 http://localhost:8080
```

> 不能用 `file://` 双击打开（ES Module 需要 HTTP 协议）。

### 部署

```bash
# 生产部署 = 复制 nobuild/ 文件夹到 Web 服务器
cp -r nobuild/ /var/www/html/
```

### 目录结构

```
nobuild/
  index.html      # 入口
  amis/           # AMIS SDK 本地文件
  js/
    store.js          # 状态管理（替代 Zustand）
    api-client.js     # HTTP 客户端（封装 fetch）
    mock.js           # mock 数据 + API 拦截（替代 MSW）
    amis-schema.js    # AMIS 低代码渲染器
    app-shell.js      # 根组件
    app-layout.js     # 布局组件
    app-menu.js       # 菜单组件
    app-router.js     # 路由组件
    login-page.js     # 登录页
```

### 修改指南

编辑 `nobuild/` 下的 `.js` 文件即可。新增模拟接口在 `nobuild/js/mock.js` 中添加路由和处理器。

## 架构概览

**Monorepo**（pnpm workspace），包含 3 个包：

- `packages/shell/`（`@admerp/shell`）— 骨架层。所有 UI 组件均为原生 Custom Elements：
  - `app-shell`（根组件，登录态控制）、`app-layout`（侧栏+顶栏+内容区布局）、`app-menu`（动态菜单树）、`app-router`（客户端路由）、`login-page`
- `packages/shared/`（`@admerp/shared`）— 共享层。类型定义（`types/`）、HTTP 客户端（`api/client.ts`：封装 `get/post/put/del`）、Zustand 状态管理（`store/auth.ts`、`store/menu.ts`）
- `packages/amis-renderer/`（`@admerp/amis-renderer`）— `amis-schema` 自定义元素，封装百度 AMIS 低代码引擎

**启动流程：** `index.html` → 加载 AMIS SDK + MSW Mock → 导入 `packages/shell/src/index.ts` → 注册所有 Web Components → `<app-shell>` 检查登录态 → 显示 `<login-page>` 或 `<app-layout>` → `<app-menu>` + `<app-router>` → `<amis-schema>`

**动态路由：** 从 `GET /api/system/route` 获取路由配置。组件 URL 两种格式：
- `amis://<name>` → 从 `/api/system/component?name=<name>` 加载 AMIS JSON Schema 渲染
- `wc://<tag-name>` → 直接渲染原生 Custom Element

## 关键规范

- **Shadow DOM 策略：** `app-shell`、`app-layout`、`app-router`、`amis-schema` 不使用 Shadow DOM（AMIS CSS 需要穿透）。`app-menu` 和 `login-page` 使用 Shadow DOM（样式隔离）
- **状态管理：** Zustand vanilla 模式（非 React）。通过 `createStore` 创建，`.getState()` / `.subscribe()` 访问。整个项目无 JSX/React
- **组件通信：** 所有 DOM 事件使用 `CustomEvent`，参数 `bubbles: true, composed: true`。组件间通过事件驱动（如 `navigate` 事件）
- **API 格式：** 所有接口返回 `{ status: 0, msg: "ok", data: { ... } }`。CRUD 列表使用 `{ items, total, page, perPage }`
- **Mock 机制：** MSW 在开发环境拦截所有 `/api/*` 请求。处理器在 `mock/handlers/`，种子数据在 `mock/data/index.ts`。开发无需后端

## 新增页面流程

1. 在 `mock/data/index.ts` 中添加菜单项和路由配置
2. 在 `mock/handlers/system.ts` 中添加 AMIS Schema（`amis://` 页面），或在 `packages/shell/src/components/` 中创建 Web Component（`wc://` 页面）
3. 在 `mock/handlers/` 下新建 MSW API 处理器，并在 `mock/browser.ts` 中注册
4. 如需新类型，在 `packages/shared/src/types/` 中添加

## 命名规范

- 自定义元素标签：kebab-case（`app-shell`、`login-page`）
- 组件类名：PascalCase（`AppShell`、`LoginPage`）
- API 路径：`/api/<domain>/<action>`
- 包名：`@admerp/<name>`
