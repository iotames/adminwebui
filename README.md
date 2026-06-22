# Admerp 企业管理中台

基于 **原生 Web Components + AMIS 低代码引擎** 的企业管理中台前端项目。

- 主项目使用 TypeScript + Vite + Zustand + MSW（`packages/`）
- `nobuild/` 目录是一个**免编译纯静态版本**，手动维护，去掉了全部构建工具和 npm 依赖

## 快速体验（免编译版）

不需要安装 Node.js、pnpm 等任何工具，有 Python 即可：

```bash
cd nobuild && python -m http.server 8080
# 浏览器打开 http://localhost:8080
```

任意用户名密码即可登录（演示环境）。

## 目录结构

```
├── packages/               # 主项目源码（TypeScript + Vite）
│   ├── shell/              # 骨架层：Web Components（app-shell, app-layout 等）
│   ├── shared/             # 共享层：类型定义、HTTP 客户端、Zustand 状态管理
│   └── amis-renderer/      # AMIS 低代码渲染器（amis-schema 自定义元素）
├── mock/                   # MSW Mock 数据（主项目开发环境用）
│   ├── browser.ts          # MSW worker 入口
│   ├── data/               # 种子数据
│   └── handlers/           # API 处理器
├── public/
│   └── amis/               # AMIS SDK 本地文件
├── nobuild/                # 免编译纯静态版本（无需 Vite/npm/TypeScript）
│   ├── index.html          # 入口
│   ├── amis/               # AMIS SDK（同上）
│   └── js/                 # 原生 JavaScript 源码
├── CLAUDE.md               # Claude Code 开发指南
└── package.json            # 主项目依赖（仅 Vite + Zustand + MSW）
```

## 主项目（Vite 版本）

### 前置要求

- Node.js >= 18
- pnpm

### 开发

```bash
pnpm install
pnpm dev       # 启动 Vite 开发服务器（端口 3000）
```

### 构建部署

```bash
pnpm build     # 输出到 dist/
```

## nobuild/ — 免编译版本

### 解决了什么问题

主项目依赖 Vite、TypeScript、Zustand、MSW、pnpm monorepo 等工具链。`nobuild/` 将这些全部去掉，换来：

- **零工具链**：一个文件夹扔到任何 Web 服务器即可运行
- **部署 = 复制文件**：没有 `build` 步骤
- **不受第三方工具影响**：Vite 出问题不会导致项目瘫痪
- **可以用记事本修改**：不需要编译步骤

### 对主项目的改动

| 主项目 | nobuild/ |
|--------|----------|
| TypeScript `.ts` | 原生 JavaScript `.js` |
| Vite 开发服务器 + HMR | 任意静态 HTTP 服务，手动刷新 |
| `import from 'zustand'` | 手写 `createStore` pub/sub（20 行）|
| MSW Service Worker | 手写 `fetch` 拦截器 |
| monorepo 跨包引用 | 扁平目录 + 相对路径 `import` |
| 路径别名（`@shared` 等） | 相对路径 |

### 启动

```bash
cd nobuild
python -m http.server 8080     # 或 npx serve .
# 浏览器打开 http://localhost:8080
```

ES Module 需要 HTTP 协议，`file://` 双击无法运行。

### 部署

```bash
# 直接复制 nobuild/ 文件夹到 Web 服务器
scp -r nobuild/ user@server:/var/www/html/
```

### 修改指引

- **增删页面**：修改 `nobuild/js/mock.js` 中的 `routesCfg` 和 `menus`，添加 AMIS schema
- **新增 mock 接口**：在 `nobuild/js/mock.js` 中添加 `addRoute(method, path, handler)`
- **修改组件**：编辑 `nobuild/js/*.js` 对应文件
- **对接真实后端**：删除 `nobuild/js/mock.js` 中的 fetch 拦截器；或修改 `api-client.js` 的 `BASE_URL`

### 已知局限

- 无 TypeScript 类型检查（不适合大型团队协作）
- mock 仅在 `fetch` 层面拦截，AMIS 通过自定义 `fetcher` 接入 mock（见 `amis-schema.js`）
- 无 HMR 热更新，改代码需手动刷新

## 技术栈

- **UI 框架**：原生 Web Components（Custom Elements）
- **低代码引擎**：百度 AMIS（`amis-schema` 自定义元素封装）
- **状态管理**：Zustand（主项目）/ 手写 pub/sub（nobuild）
- **Mock**：MSW（主项目）/ 手写 fetch 拦截器（nobuild）
- **语言**：TypeScript（主项目）/ 原生 JavaScript（nobuild）
- **构建工具**：Vite（主项目）/ 无需构建（nobuild）
