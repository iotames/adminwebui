# Admerp WebUI · 企业应用中台前端

Admerp 是一个**面向领域驱动设计（DDD）**的极简企业中台前端框架。核心理念是**技术栈无关、高内聚低耦合、组件化、高扩展**，让新业务域能以最低成本接入。

## 核心理念

- **极简框架** — 基于 Web Components 原生标准，不锁定任何前端框架。骨架层脱离具体技术栈，接入模块无限制
- **DDD 友好** — 每个业务领域可独立为 package，独立开发、独立部署、独立演进
- **低代码渲染** — 集成百度 AMIS 低代码引擎，页面可按需在「代码编程」与「Schema 配置」间切换
- **Mock 驱动开发** — MSW（Mock Service Worker）在浏览器端拦截请求，开发阶段完全脱离后端 API
- **逻辑与 UI 分离** — 支持无头组件设计，业务逻辑可跨 UI 层复用

## 架构概览

```
┌────────────────────────────────────────────────┐
│                  index.html                     │
│  <app-shell /> ← 根组件（无框架 Shadow DOM）    │
├────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────┐  ┌──────────────────────────────┐  │
│  │ app-menu │  │         app-router            │  │
│  │ (Shadow  │  │  ┌─────────────────────────┐  │  │
│  │  DOM)    │  │  │ amis-schema（AMIS渲染）  │  │  │
│  │          │  │  │ wc://xxx（原生组件）     │  │  │
│  │ 动态菜单 │  │  └─────────────────────────┘  │  │
│  └──────────┘  └──────────────────────────────┘  │
│                                                    │
│  packages/shell  ← 骨架层                          │
│  packages/shared ← 共享层（类型/API/Store）        │
│  packages/amis-renderer ← AMIS 渲染适配器          │
├────────────────────────────────────────────────┤
│           MSW Mock 服务（开发环境）              │
│  /api/system/*   /api/auth/*   /api/dept/*     │
│  /api/user/*     （浏览器端拦截，无需后端）       │
└────────────────────────────────────────────────┘
```

### 数据流

```
统一 API 接口 → MSW Mock 拦截 → JSON 响应 → 前端动态渲染
     ↑                    ↑
  真实后端             开发环境
（部署时切换）       （无需后端）
```

## 快速开始

```bash
# 环境要求
# Node.js >= 18、pnpm >= 9

# 安装依赖
pnpm install

# 启动开发服务器（自动启用 MSW Mock）
pnpm dev
# → http://localhost:3000

# 登录（任意用户名密码即可）
# 演示环境无需真实后端
```

## 项目结构

```
admerp-webui/
├── index.html                  # 入口 HTML
├── vite.config.ts              # Vite 构建配置
├── tsconfig.json               # TypeScript 配置
├── pnpm-workspace.yaml         # Monorepo 工作区
├── package.json                # 根 package
│
├── packages/
│   ├── shell/                  # 骨架层
│   │   └── src/
│   │       ├── index.ts
│   │       └── components/
│   │           ├── app-shell.ts      # 根组件（登录/主界面切换）
│   │           ├── app-layout.ts     # 主布局（侧栏+顶栏+内容区）
│   │           ├── app-menu.ts       # 动态菜单
│   │           ├── app-router.ts     # 动态路由
│   │           └── login-page.ts     # 登录页面（原生组件）
│   │
│   ├── shared/                 # 共享层
│   │   └── src/
│   │       ├── index.ts
│   │       ├── types/          # 类型定义
│   │       ├── api/            # API 客户端（fetch 封装）
│   │       └── store/          # 状态管理（Zustand）
│   │
│   └── amis-renderer/          # AMIS 低代码渲染器
│       └── src/
│           ├── index.ts
│           └── amis-schema.ts  # <amis-schema> 自定义元素
│
├── mock/                       # MSW Mock 服务
│   ├── browser.ts              # Service Worker 入口
│   ├── data/                   # 模拟数据
│   └── handlers/               # 请求处理器
│       ├── auth.ts             # 认证
│       ├── dept.ts             # 部门 CRUD
│       ├── user.ts             # 用户 CRUD
│       └── system.ts           # 菜单/路由/Schema
│
├── public/
│   └── amis/                   # AMIS SDK（6.13.0）
│
└── scripts/
    └── verify.mjs              # Puppeteer 端到端验证
```

## 快速导航

| 目的 | 文档 |
|------|------|
| 理解各包职责、组件关系、Shadow DOM 策略 | [架构详解](dev.md#项目架构) |
| 本地开发（启动、Mock、HMR） | [开发流程](dev.md#开发流程) |
| 接入新业务域（AMIS / WC / 独立包） | [接入新业务域](dev.md#接入新业务域) |
| 编写 AMIS Schema（CRUD 模板、数据格式） | [AMIS Schema 开发](dev.md#amis-schema-开发) |
| 新增 Mock API（MSW handler 写法） | [Mock API 开发](dev.md#mock-api-开发) |
| 组件开发规范（生命周期、命名、事件通信） | [组件开发规范](dev.md#组件开发规范) |
| 运行 Puppeteer 端到端验证 | [验证与测试](dev.md#验证与测试) |
| 构建部署、切换真实后端 | [构建与部署](dev.md#构建与部署) |
| 常见问题（样式、路由、MSW 不拦截等） | [常见问题](dev.md#常见问题) |

详细开发指南请参阅 **[dev.md](dev.md)**。

## 核心技术点

### Web Components 原生架构

所有界面组件均为标准 Custom Elements，不依赖任何框架。主骨架 `app-shell` 不使用 Shadow DOM（以保证 AMIS CSS 正常穿透），子组件如 `app-menu`、`login-page` 使用 Shadow DOM 实现样式隔离。

### 动态路由与菜单

登录后通过统一 API 一次性获取菜单和路由配置：

```
GET /api/system/menu   → 多级菜单树
GET /api/system/route  → 路由表（path ↔ component 映射）
GET /api/system/component?name=xxx → 组件 Schema
```

路由组件格式：
- `amis://dept-manage` → AMIS Schema 渲染
- `wc://login-page` → 原生 Web Component 渲染

### AMIS 低代码渲染

`<amis-schema>` 自定义元素从 API 加载 AMIS JSON Schema 并渲染。支持 CRUD、表单、弹窗、数据联动等丰富组件，详情参考 [AMIS 文档](https://aisuda.bce.baidu.com/amis/zh-CN/docs/index)。

- amis-jssdk: https://github.com/baidu/amis/releases/download/6.13.0/jssdk.tar.gz

### MSW Mock 服务

开发环境下使用 MSW（Mock Service Worker）在浏览器端拦截 HTTP 请求，无需启动后端服务器。所有 API 遵循统一的数据格式：

```json
{
  "status": 0,
  "msg": "ok",
  "data": { ... }
}
```
