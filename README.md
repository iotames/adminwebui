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

## 生产部署（Nginx 配置）

SPA 路由在刷新时必须 fallback 到 `index.html`，否则会 404。**两种版本都需要**，仅 `root` 目录不同：

**`pnpm build` 的 `dist/` 部署：**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;             # Vite 构建产物目录

    index index.html;

    location / {
        try_files $uri $uri/ /index.html;  # SPA fallback
    }

    # API 反向代理（可选）
    location /api/ {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**`nobuild/` 部署：**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/nobuild;          # 免编译静态目录

    index index.html;

    location / {
        try_files $uri $uri/ /index.html;  # SPA fallback
    }

    location /api/ {
        proxy_pass http://localhost:8081;
    }

    # AMIS SDK 资源加长期缓存
    location /amis/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

> **原理：** `try_files $uri $uri/ /index.html` 让 Nginx 先匹配真实文件或目录，找不到时返回 `index.html`，客户端路由（`popstate`）再解析 URL 路径。

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

## 对接真实后端 API

### Vite 版本

**开发环境**：默认同域 mock，无需额外设置。如需对接真实后端：

方式一——在项目根目录创建 `.env` 文件：

```
VITE_BASE_API_URL=http://localhost:8081
```

方式二——Vite proxy（推荐，无跨域问题），编辑 `vite.config.ts`：

```ts
server: {
  proxy: { '/api': { target: 'http://localhost:8081', changeOrigin: true } },
}
```

**生产构建**：必须设置 `VITE_BASE_API_URL` 环境变量，否则 `pnpm build` 会报错退出：

```bash
VITE_BASE_API_URL=https://api.example.com pnpm build
```

原理：`packages/shared/src/api/client.ts` 通过 `import.meta.env.VITE_BASE_API_URL` 读取该变量，Vite 在构建时会将其内联到产物中。

### nobuild 版本

方式一——直接编辑 `nobuild/js/api-client.js` 顶部的 `BASE_URL`：

```js
const BASE_URL = '';                        // 改前：同域 mock
const BASE_URL = 'https://api.example.com';  // 改后：真实后端
```

方式二——在 `index.html` 中通过普通 `<script>` 注入（免改源码）：

```html
<script>window.__ENV__ = { BASE_API_URL: 'https://api.example.com' };</script>
```

两种方式都需要移除 `nobuild/js/mock.js` 中的 `window.fetch = mockFetch`，否则请求被 mock 拦截。
