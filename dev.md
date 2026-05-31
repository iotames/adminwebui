# 二次开发指南

本文档面向需要在 Admerp WebUI 基础上进行功能扩展、接入新业务域或修改现有功能的开发者。

## 目录

- [环境准备](#环境准备)
- [项目架构](#项目架构)
- [各包详解](#各包详解)
- [开发流程](#开发流程)
- [接入新业务域](#接入新业务域)
- [AMIS Schema 开发](#amis-schema-开发)
- [Mock API 开发](#mock-api-开发)
- [组件开发规范](#组件开发规范)
- [验证与测试](#验证与测试)
- [构建与部署](#构建与部署)
- [常见问题](#常见问题)

## 环境准备

```bash
# 依赖
# Node.js >= 18（推荐 20 LTS）
# pnpm >= 9（npm i -g pnpm）

# 安装
pnpm install

# 启动开发服务器
pnpm dev
# → 浏览器自动打开 http://localhost:3000

# 登录
# 任意用户名密码即可（MSW Mock 模式）
```

**项目根目录 `package.json` 可用脚本：**

| 命令 | 用途 |
|------|------|
| `pnpm dev` | 启动 Vite 开发服务器，端口 3000 |
| `pnpm build` | 生产构建，输出到 `dist/` |
| `pnpm preview` | 预览构建产物 |
| `pnpm mock:init` | 重新初始化 MSW Service Worker |

## 项目架构

### 启动流程

```
浏览器打开 http://localhost:3000
       │
       ▼
  index.html 加载
   ├── AMIS SDK（/amis/sdk.js + sdk.css）
   ├── MSW 启动（mock/browser.ts）
   │    └── 注册 Service Worker，拦截 API
   └── 导入 packages/shell/src/index.ts
        └── 注册所有 Web Components
             └── <app-shell> 升级 → connectedCallback
                  ├── 无 token → <login-page>
                  └── 有 token → <app-layout>
                       ├── <app-menu>（获取菜单）
                       └── <app-router>（获取路由 → 渲染页面）
                            └── <amis-schema>（获取 Schema → AMIS 渲染）
```

### 分层结构

```
index.html  ← 入口（AMIS SDK + MSW + 全局样式）
  │
  ├── packages/shell/     ← 骨架层
  │   ├── app-shell       ← 根组件（认证控制）
  │   ├── app-layout      ← 主布局（侧栏 + 顶栏 + 内容区）
  │   ├── app-menu        ← 动态菜单（Shadow DOM）
  │   ├── app-router      ← 动态路由
  │   └── login-page      ← 登录页（Shadow DOM）
  │
  ├── packages/shared/    ← 共享层
  │   ├── types/          ← 类型定义
  │   ├── api/client.ts   ← HTTP 客户端
  │   └── store/          ← Zustand 状态管理
  │
  ├── packages/amis-renderer/  ← AMIS 渲染适配
  │   └── amis-schema     ← <amis-schema> 自定义元素
  │
  ├── mock/               ← MSW Mock
  │   ├── browser.ts      ← Service Worker 入口
  │   ├── data/           ← 模拟数据
  │   └── handlers/       ← 请求处理器
  │
  └── public/amis/        ← AMIS SDK 静态资源
```

### Shadow DOM 使用策略

| 组件 | Shadow DOM | 原因 |
|------|-----------|------|
| `app-shell` | ❌ 否 | 需穿透 AMIS CSS（sdk.css）到子节点 |
| `app-layout` | ❌ 否 | 内容需被主文档样式覆盖 |
| `app-router` | ❌ 否 | 内容区需展示 AMIS 渲染结果 |
| `amis-schema` | ❌ 否 | AMIS embed 操作 light DOM |
| `app-menu` | ✅ 是 | 菜单样式隔离 |
| `login-page` | ✅ 是 | 登录表单样式隔离 |

## 各包详解

### @admerp/shell

骨架层，包含所有界面组件。

**组件关系：**

```
<app-shell>
  ├── <login-page>         (未登录时)
  └── <app-layout>         (已登录时)
       ├── 侧栏
       │   ├── Logo
       │   ├── <app-menu>
       │   └── Footer
       └── 主区域
           ├── 顶栏（标题 + 用户信息 + 退出按钮）
           └── <app-router>
                └── <amis-schema> 或 自定义组件
```

**组件职责：**

| 组件 | 文件 | 说明 |
|------|------|------|
| `app-shell` | `components/app-shell.ts` | 根组件，根据登录态切换 login/layout |
| `app-layout` | `components/app-layout.ts` | 主布局，管理标题和用户显示 |
| `app-menu` | `components/app-menu.ts` | 动态菜单，Shadow DOM 隔离 |
| `app-router` | `components/app-router.ts` | 客户端路由，解析 `wc://` / `amis://` |
| `login-page` | `components/login-page.ts` | 登录表单，Shadow DOM 隔离 |

### @admerp/shared

共享层，提供类型、API、状态管理。

**API 客户端（`api/client.ts`）：**

```ts
// 封装 fetch，自动附加 Authorization
import { get, post, put, del } from '@admerp/shared';

const data = await get<ResponseType>('/api/resource');
const result = await post<ResponseType>('/api/resource', body);
```

**状态管理（基于 Zustand vanilla）：**

```ts
// authStore — 认证状态
import { authStore } from '@admerp/shared';
authStore.getState().token;       // 当前 token
authStore.getState().user;        // 当前用户
authStore.getState().setAuth();   // 登录
authStore.getState().logout();    // 退出

// menuStore — 菜单与路由
import { menuStore } from '@admerp/shared';
menuStore.getState().menus;       // 菜单树
menuStore.getState().routes;      // 路由表
menuStore.subscribe(state => {}); // 订阅变化
```

**类型定义一览：**

| 类型 | 文件 | 用途 |
|------|------|------|
| `MenuItem` | `types/menu.ts` | 菜单项（树形结构） |
| `RouteConfig` | `types/route.ts` | 路由配置（path → component） |
| `User` | `types/user.ts` | 用户 |
| `Dept` | `types/dept.ts` | 部门 |

**路由组件格式（`parseComponentUrl()`）：**

```
amis://dept-manage  →  AMIS Schema 渲染
wc://login-page     →  原生 Web Component 渲染
```

### @admerp/amis-renderer

AMIS 低代码渲染适配器，提供一个 `<amis-schema>` 自定义元素。

**用法：**

```html
<!-- 从 API 加载 Schema -->
<amis-schema api="/api/system/component?name=dept-manage"></amis-schema>

<!-- 或直接嵌入 Schema JSON -->
<amis-schema schema='{"type":"page","body":"<p>Hello</p>"}'></amis-schema>
```

**属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `api` | string | Schema JSON 接口地址 |
| `schema` | string | 直接传入 JSON 字符串 |
| `title` | string | 页面标题 |

**实现原理（`amis-schema.ts`）：**

1. `connectedCallback` 创建容器 `<div id="container">`
2. 根据 `api` 或 `schema` 属性获取 AMIS JSON Schema
3. 调用 `amis.embed(container, schema, {}, { theme: 'cxd', getModalContainer: () => document.body })` 渲染
4. `disconnectedCallback` 时调用 `amisInstance.unmount()` 清理

**关键参数：**

| 参数 | 值 | 说明 |
|------|-----|------|
| `theme` | `'cxd'` | AMIS 默认主题，必须与 CSS 匹配 |
| `getModalContainer` | `() => document.body` | 弹窗渲染到 body，避免被内容区 `overflow` 裁剪 |

---

## 开发流程

### 本地开发

```bash
pnpm dev  # 启动 dev server，端口 3000
```

Vite 提供 HMR（热更新），修改代码后浏览器自动刷新。

### 修改 Mock 数据

所有 API 在 `mock/handlers/` 中定义，修改后无需重启——MSW 在浏览器端拦截，Vite HMR 会自动更新。

### 修改 AMIS Schema

Schema 定义在 `mock/handlers/system.ts` 的 `/api/system/component` 处理器中。修改后刷新页面即可生效。

### 新增 API

1. 在 `mock/data/index.ts` 中添加模拟数据
2. 在 `mock/handlers/` 下新建或修改 handler 文件
3. 在 `mock/browser.ts` 中注册 handler
4. 在 `packages/shared/src/types/` 中添加类型定义

---

## 接入新业务域

### 方式一：AMIS Schema（推荐，无需编码）

**场景：** 不需要复杂交互逻辑的 CRUD 页面。

**步骤：**

1️⃣ 在 `mock/data/index.ts` 中添加菜单和路由：

```ts
export const menus = [
  // ... 在合适位置添加
  {
    id: '4',
    path: '/orders',
    title: '订单管理',
    icon: '📦',
    children: [
      { id: '4-1', path: '/order', title: '订单列表' },
    ],
  },
];

export const routes = [
  // ... 添加新路由
  { path: '/order', title: '订单列表', component: 'amis://order-list', auth: true },
];
```

2️⃣ 在 `mock/handlers/system.ts` 的 `get /api/system/component` 中添加 Schema：

```ts
const orderSchema = {
  type: 'page',
  title: '订单列表',
  body: {
    type: 'crud',
    api: '/api/order',
    syncLocation: false,
    defaultParams: { page: 1, perPage: 10 },
    columns: [
      { name: 'id', label: '订单号' },
      { name: 'customer', label: '客户' },
      { name: 'amount', label: '金额', type: 'currency' },
      { name: 'status', label: '状态', type: 'mapping',
        map: { pending: '<span style="color:#faad14">待处理</span>', done: '<span style="color:#52c41a">已完成</span>' }
      },
      { name: 'created_at', label: '创建时间' },
      {
        type: 'operation',
        label: '操作',
        buttons: [
          { label: '详情', type: 'button', actionType: 'dialog', dialog: { ... } },
        ],
      },
    ],
    headerToolbar: [
      { type: 'button', label: '新增订单', level: 'primary', actionType: 'dialog', dialog: { ... } },
    ],
  },
};

// 在 switch 中添加
if (name === 'order-list') return HttpResponse.json(orderSchema);
```

3️⃣ 在 `mock/handlers/` 下新建 handler：

```ts
// mock/handlers/order.ts
import { http, HttpResponse, delay } from 'msw';

const orders = [
  { id: 'ORD001', customer: '张三', amount: 1280, status: 'done', created_at: '2024-06-01' },
];

export const orderHandlers = [
  http.get('/api/order', async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('perPage') || '10');
    const items = orders.slice((page - 1) * perPage, page * perPage);
    return HttpResponse.json({ status: 0, msg: 'ok', data: { items, total: orders.length, page, perPage } });
  }),
];
```

4️⃣ 在 `mock/browser.ts` 中注册：

```ts
import { orderHandlers } from './handlers/order';

export const worker = setupWorker(
  ...systemHandlers,
  ...authHandlers,
  ...deptHandlers,
  ...userHandlers,
  ...orderHandlers,  // 新增
);
```

### 方式二：原生 Web Component

**场景：** 需要自定义交互逻辑的复杂页面。

**步骤：**

1️⃣ 创建组件文件：

```ts
// packages/shell/src/components/order-page.ts
import { get } from '@admerp/shared';

export class OrderPage extends HTMLElement {
  connectedCallback() {
    this.render();
    this.loadData();
  }

  render() {
    this.innerHTML = `<div id="order-list">加载中...</div>`;
  }

  async loadData() {
    const data = await get<any[]>('/api/order');
    // ... 渲染逻辑
  }
}

customElements.define('order-page', OrderPage);
```

2️⃣ 在 `packages/shell/src/components/app-shell.ts` 中导入：

```ts
import './order-page';
```

3️⃣ 路由配置为 `wc://order-page`：

```ts
// mock/data/index.ts
{ path: '/order', title: '订单管理', component: 'wc://order-page', auth: true },
```

### 方式三：业务域独立 package

**场景：** 大规模业务域，需要独立开发和部署。

1. 创建 `packages/<domain>/`，在 `pnpm-workspace.yaml` 中注册
2. 编写组件，导出自定义元素
3. 在 `packages/shell/package.json` 中添加 workspace 依赖
4. 在 shell 中导入注册

---

## AMIS Schema 开发

AMIS 是百度开源的低代码引擎，通过 JSON Schema 描述页面。详细文档见 [AMIS 官方文档](https://aisuda.bce.baidu.com/amis/zh-CN/docs/index)。

### 常用组件速查

| 场景 | AMIS 组件 | 示例 |
|------|----------|------|
| 表格 | `crud` | CRUD 列表页 |
| 表单 | `form` | 新增/编辑弹窗 |
| 弹窗 | `dialog` | 配合 actionType:dialog 使用 |
| 按钮 | `button` | CRUD toolbar / operation |
| 文本 | `tpl` | 模板渲染 |
| 选择 | `select` | 下拉框 |
| 映射 | `mapping` | 状态标签映射 |

### 数据格式

所有 API 请求遵循统一格式：

**请求：**
```
GET /api/dept?page=1&perPage=10&name=技术
```

**响应：**
```json
{
  "status": 0,
  "msg": "ok",
  "data": {
    "items": [{ ... }],
    "total": 5,
    "page": 1,
    "perPage": 10
  }
}
```

### CRUD 快速模板

```json
{
  "type": "crud",
  "api": "/api/your-resource",
  "syncLocation": false,
  "defaultParams": { "page": 1, "perPage": 10 },
  "columns": [
    { "name": "id", "label": "ID" },
    { "name": "name", "label": "名称", "searchable": { "type": "input-text" } },
    { "name": "status", "label": "状态", "type": "mapping", "map": { "1": "启用", "0": "停用" } },
    {
      "type": "operation",
      "label": "操作",
      "buttons": [
        { "label": "编辑", "type": "button", "actionType": "dialog", "dialog": { "body": { "type": "form", "api": "put:/api/your-resource/${id}", "body": [...] } } },
        { "label": "删除", "type": "button", "level": "danger", "actionType": "ajax", "api": "delete:/api/your-resource/${id}", "confirmText": "确认删除？" }
      ]
    }
  ],
  "headerToolbar": [
    { "type": "button", "label": "新增", "level": "primary", "actionType": "dialog", "dialog": { "body": { "type": "form", "api": "post:/api/your-resource", "body": [...] } } }
  ]
}
```

---

## Mock API 开发

### MSW 请求处理格式

```ts
import { http, HttpResponse, delay } from 'msw';

export const exampleHandlers = [
  // GET — 列表查询
  http.get('/api/example', async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');

    return HttpResponse.json({
      status: 0,
      msg: 'ok',
      data: { items: [...], total: 10, page },
    });
  }),

  // POST — 新增
  http.post('/api/example', async ({ request }) => {
    await delay(300);
    const body = await request.json();
    // 处理逻辑...
    return HttpResponse.json({ status: 0, msg: '新增成功' });
  }),

  // PUT — 更新（带路径参数）
  http.put('/api/example/:id', async ({ params, request }) => {
    const id = parseInt(params.id as string);
    const body = await request.json();
    return HttpResponse.json({ status: 0, msg: '更新成功' });
  }),

  // DELETE — 删除
  http.delete('/api/example/:id', async ({ params }) => {
    const id = parseInt(params.id as string);
    return HttpResponse.json({ status: 0, msg: '删除成功' });
  }),
];
```

### 模拟数据

```ts
// mock/data/index.ts — 集中管理模拟数据
export const examples = [
  { id: 1, name: '示例A', status: 1, created_at: '2024-01-01' },
  { id: 2, name: '示例B', status: 0, created_at: '2024-02-01' },
];
```

---

## 组件开发规范

### Web Component 模板

```ts
export class MyElement extends HTMLElement {
  // 生命周期
  connectedCallback() {
    // 元素被插入 DOM
    this.render();
    this.bindEvents();
  }

  disconnectedCallback() {
    // 元素从 DOM 移除 — 清理事件监听等
  }

  // 可选：监听属性变化
  static get observedAttributes() { return ['data']; }

  attributeChangedCallback(name: string, old: string, val: string) {
    if (old !== val) this.render();
  }

  render() {
    this.innerHTML = `<div class="my-element">内容</div>`;
  }

  bindEvents() {
    this.querySelector('button')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('my-event', { bubbles: true, composed: true }));
    });
  }
}

customElements.define('my-element', MyElement);
```

### 命名规范

| 类型 | 格式 | 示例 |
|------|------|------|
| 自定义元素标签 | kebab-case | `app-shell`、`login-page` |
| 组件类名 | PascalCase | `AppShell`、`LoginPage` |
| API 路径 | /api/<domain>/<action> | `/api/dept`、`/api/auth/login` |
| 包名 | `@admerp/<name>` | `@admerp/shared` |

### 事件通信

组件间通信通过 DOM 事件：

```ts
// 发送（Shadow DOM 内需设置 composed: true）
this.dispatchEvent(new CustomEvent('navigate', {
  detail: { path: '/dept' },
  bubbles: true,
  composed: true,  // 穿透 Shadow DOM
}));

// 接收
this.addEventListener('navigate', (e: CustomEvent) => {
  const { path } = e.detail;
  // ...
});
```

---

## 验证与测试

项目内置 Puppeteer 端到端验证脚本。

### 运行验证

```bash
# 1. 先启动 dev server
pnpm dev

# 2. 另开终端运行（需指定 Chrome 路径）
export CHROME_PATH=/path/to/chrome
pnpm tsx scripts/verify.mjs

# 示例（Puppeteer 自动下载的 Chrome）：
CHROME_PATH=$HOME/.cache/puppeteer/chrome/linux64-*/chrome-linux64/chrome pnpm tsx scripts/verify.mjs
```

### 验证内容

`scripts/verify.mjs` 自动执行：

1. ✅ 登录页面渲染
2. ✅ 登录流程（填写表单 + 提交）
3. ✅ 布局渲染（用户信息 + 页面标题）
4. ✅ 部门管理 —— AMIS CRUD 表格渲染 + 数据加载
5. ✅ 用户管理 —— AMIS CRUD 表格渲染 + 数据加载
6. ✅ 全部 Mock API 接口调用（menu / route / dept / user / auth / schema）

### 截图输出

验证结果截图保存在 `verify-output/` 目录。

---

## 构建与部署

### 生产构建

```bash
pnpm build
```

输出到 `dist/` 目录，包含纯静态 HTML/CSS/JS 三件套。

### 部署方式

```nginx
# Nginx 配置
server {
  listen 80;
  server_name your-domain.com;
  root /path/to/dist;

  # SPA fallback（history 模式）
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

### 切换真实后端

1. 在 `mock/browser.ts` 中注释掉 `worker.start()`
2. 或在 `index.html` 中移除 MSW 导入
3. 修改 `packages/shared/src/api/client.ts` 中的 `BASE_URL` 指向真实后端

---

## 常见问题

### AMIS 按钮点击无反应

- 检查 `getModalContainer` 是否设为 `() => document.body`
- 检查弹窗是否被父容器 `overflow: hidden` 裁剪
- 浏览器控制台是否有报错

### AMIS 样式不生效

- 确认 `app-shell` 没有使用 `attachShadow()`（否则主文档 CSS 无法穿透）
- 确认 AMIS CSS 文件正确加载（`/amis/sdk.css`、`/amis/helper.css`）
- 确认 embed 参数 `theme: 'cxd'` 与 CSS 文件名匹配

### 页面路由不匹配

- 检查 `mock/data/index.ts` 中的 `routes` 表
- 确认 path 与菜单中的 path 一致
- 访问不存在的路径会显示 404

### MSW 不拦截请求

- 浏览器控制台看 MSW 是否 `[MSW] Mocking enabled.`
- 确认 Service Worker 已注册（`/mockServiceWorker.js` 可访问）
- 清除浏览器缓存后刷新

### Web Component 未注册

- 检查组件文件是否被 `import`
- 确认 `customElements.define()` 的标签名与使用时一致
- 自定义元素名必须包含连字符（kebab-case）
