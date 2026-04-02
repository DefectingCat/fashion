# 博客项目实施技术方案（Vite + Bun SSR）

## 一、项目概述

基于 Bun、React、Tailwind CSS、bun:sqlite 和 Vite 构建的现代化博客系统，支持 SSR（服务端渲染）、文章管理、用户认证、评论系统等功能。

**核心问题：** Bun 无法直接作为浏览器模块加载 TypeScript/JSX 文件，导致客户端水合失败。

**解决方案：** 使用 Vite 作为前端构建工具，处理 TypeScript/JSX 编译和模块加载；Bun 仅作为后端运行时。

---

## 二、技术栈选择

| 层级         | 技术         | 版本     | 理由                                                      |
| ------------ | ------------ | -------- | --------------------------------------------------------- |
| **后端运行时** | Bun          | v1.3.9+ | 极速启动、原生 TypeScript 支持、内置工具链               |
| **Web 框架** | Elysia       | v1.4+   | TypeScript 优先、高性能、类型安全路由、专为 Bun 设计      |
| **数据库**   | bun:sqlite   | -       | 零配置、高性能                                            |
| **前端构建** | Vite         | v5.x    | 处理 TS/JSX 编译、模块加载、HMR、开发服务器               |
| **前端框架** | React        | v19.x   | 最新版本、生态完善                                        |
| **路由**     | React Router | v6.x    | 稳定版本、支持 SSR（StaticRouter）                        |
| **渲染方案** | SSR          | -       | Vite SSR + 服务端渲染、SEO 优化                          |
| **样式方案** | Tailwind CSS | v4.x    | 现代化 CSS 框架                                            |

---

## 三、项目架构设计

### 3.1 目录结构

```
fashion/
├── src/                          # 后端代码（Bun）
│   ├── server.ts                 # Elysia 服务器入口
│   ├── db/
│   │   ├── index.ts             # bun:sqlite 数据库连接
│   │   ├── schema.ts            # 数据库 Schema 定义
│   │   └── seed.ts             # 初始化数据
│   ├── routes/
│   │   ├── posts.ts            # 文章路由
│   │   ├── auth.ts             # 认证路由
│   │   └── comments.ts         # 评论路由
│   └── types/
│       └── index.ts             # TypeScript 类型定义
├── frontend/                     # 前端代码（Vite）
│   ├── src/
│   │   ├── entry-client.tsx    # 客户端入口
│   │   ├── entry-server.tsx    # 服务端入口（Vite SSR）
│   │   ├── App.tsx            # 根组件
│   │   ├── main.ts            # Vite 入口
│   │   ├── pages/             # 页面组件
│   │   ├── components/        # 通用组件
│   │   └── styles/
│   │       └── global.css     # 全局样式
│   ├── index.html             # HTML 入口
│   ├── vite.config.ts         # Vite 配置
│   └── package.json           # 前端依赖
├── public/                     # 静态资源
├── package.json               # 根 package.json (workspace)
├── tsconfig.json              # TypeScript 配置
├── vite.config.ts            # 根 Vite 配置
└── bun.lockb
```

### 3.2 架构模式

- **Monorepo 架构**：使用 Bun workspace 管理前后端
- **前后端分离**：前端 Vite 开发服务器 + 后端 Bun Elysia API
- **Vite SSR**：Vite 处理 SSR 模块加载和数据预取
- **类型共享**：共享类型定义确保端到端类型安全

### 3.3 请求流程

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端浏览器                          │
└─────────────────────┬───────────────────────────────────────┘
                      │ 1. 请求 HTML
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Bun Elysia 服务器                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Elysia 处理请求                                        │ │
│  │  - /api/* → API 路由处理                               │ │
│  │  - / → SSR 渲染                                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │ 2. 返回 HTML + JS Bundle
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Vite 开发服务器                           │
│  - 处理 TypeScript/JSX 编译                                  │
│  - 模块热更新 (HMR)                                          │
│  - 静态文件服务                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 四、核心问题与解决方案

### 4.1 问题描述

**原始方案：** Bun 直接处理前端请求

```typescript
// ❌ 问题：Bun 无法加载 TSX 文件作为浏览器模块
.get("*", async ({ request }) => {
  return renderSSR(request); // React SSR
})
.get("/frontend/src/entry-client.tsx") // ❌ 无法处理 TSX
```

**错误信息：**
```
SyntaxError: missing ) after argument list
No routes matched location "/@vite/client"
```

### 4.2 解决方案：Vite + Bun 双服务器

```typescript
// ✅ 解决方案：前后端分离架构
// 后端 (Bun Elysia)：处理 API + SSR 页面
// 前端 (Vite)：处理静态资源 + HMR + 构建
```

---

## 五、SSR 实现方案

### 5.1 技术选型

采用 **Vite SSR** 方案：

| 技术         | 作用                                                       |
| ------------ | ---------------------------------------------------------- |
| **Vite**     | 开发服务器、SSR 渲染、模块加载、构建                       |
| **Bun**      | API 服务、数据处理                                         |
| **React 18** | UI 框架，renderToString 和 hydrateRoot                    |
| **Elysia**   | API 路由                                                   |

### 5.2 核心实现

#### 5.2.1 Vite 配置 (vite.config.ts)

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  root: "./frontend",
  resolve: {
    alias: {
      "@": resolve(__dirname, "frontend/src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "../dist/client",
    rollupOptions: {
      input: resolve(__dirname, "frontend/index.html"),
    },
  },
  ssr: {
    noExternal: ["react", "react-dom", "react-router-dom"],
  },
});
```

#### 5.2.2 服务端入口 (entry-server.tsx)

```typescript
import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { Routes, Route } from "react-router-dom";
import App from "./App";

export async function render(url: string) {
  return renderToString(
    <StaticRouter location={url}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/post/:slug" element={<PostDetail />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
      </Routes>
    </StaticRouter>
  );
}
```

#### 5.2.3 客户端入口 (entry-client.tsx)

```typescript
import React from "react";
import { hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/global.css";

hydrateRoot(
  document.getElementById("root")!,
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
```

#### 5.2.4 HTML 模板 (index.html)

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>我的博客</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  </head>
  <body>
    <div id="root"><!--ssr-outlet--></div>
    <script type="module" src="/src/entry-client.tsx"></script>
  </body>
</html>
```

#### 5.2.5 Elysia 服务器 (server.ts)

```typescript
import { Elysia } from "elysia";
import { postsRoutes } from "./routes/posts";
import { authRoutes } from "./routes/auth";

const app = new Elysia()
  .decorate("db", db)
  .use(postsRoutes)
  .use(authRoutes)
  .get("/api/health", () => ({ status: "ok" }))
  .listen(3000);
```

---

## 六、数据库设计

### 6.1 bun:sqlite Schema

使用现有的 schema.ts 实现，包含：
- users：用户表
- posts：文章表
- tags：标签表
- post_tags：文章-标签关联表
- comments：评论表

---

## 七、API 接口规范

### 7.1 RESTful API 设计

| 方法     | 路径                      | 描述               |
| -------- | ------------------------- | ------------------ |
| `POST`   | `/api/auth/register`      | 用户注册           |
| `POST`   | `/api/auth/login`         | 用户登录           |
| `GET`    | `/api/posts`              | 获取文章列表       |
| `GET`    | `/api/posts/:id`          | 获取文章详情       |
| `POST`   | `/api/posts`              | 创建文章（需认证） |
| `PUT`    | `/api/posts/:id`          | 更新文章（需认证） |
| `DELETE` | `/api/posts/:id`          | 删除文章（需认证） |

---

## 八、分步骤实施计划

### Phase 1: 项目初始化（1 天）

**任务清单：**

- [ ] 初始化 Bun workspace 项目
- [ ] 创建前后端分离目录结构
- [ ] 配置 Vite + React
- [ ] 配置 TypeScript
- [ ] 安装依赖包

**验收标准：**

- Vite 开发服务器正常运行
- 前端页面可以访问
- HMR 工作正常

---

### Phase 2: 数据库设计与初始化（0.5 天）

**任务清单：**

- [ ] 设计数据库 Schema
- [ ] 实现 bun:sqlite 连接
- [ ] 创建数据库初始化脚本
- [ ] 创建种子数据脚本

**验收标准：**

- 数据库正常创建和连接
- 种子数据正常插入

---

### Phase 3: 后端 API 开发（2 天）

**任务清单：**

- [ ] 实现用户认证 API
- [ ] 实现 JWT 认证中间件
- [ ] 实现文章 CRUD API
- [ ] API 接口测试

**验收标准：**

- 所有 API 接口正常工作
- 认证功能正常

---

### Phase 4: Vite SSR 集成（1.5 天）

**任务清单：**

- [ ] 配置 Vite SSR
- [ ] 实现服务端入口
- [ ] 配置客户端入口
- [ ] 实现客户端水合
- [ ] 前后端数据预取

**验收标准：**

- SSR 正常工作
- 服务端渲染的 HTML 正确
- 客户端水合成功

---

### Phase 5: 前端页面开发（2 天）

**任务清单：**

- [ ] 实现基础布局组件
- [ ] 实现首页
- [ ] 实现文章详情页
- [ ] 实现登录/注册页
- [ ] 实现用户中心页

**验收标准：**

- 所有页面正常显示
- 路由导航正常
- 响应式布局正常

---

### Phase 6: 功能完善与优化（1.5 天）

**任务清单：**

- [ ] 实现 Markdown 编辑器
- [ ] 实现图片上传功能
- [ ] 实现评论系统
- [ ] SEO 优化
- [ ] 性能优化

**验收标准：**

- 所有功能正常工作
- Markdown 渲染正确

---

### Phase 7: 测试与部署（1 天）

**任务清单：**

- [ ] 编写测试
- [ ] 手动功能测试
- [ ] Bug 修复
- [ ] 部署配置

**验收标准：**

- 无严重 Bug
- 生产环境正常运行

---

**总计时间：9 天**

---

## 九、开发脚本

### 9.1 根 package.json

```json
{
  "name": "fashion-blog",
  "private": true,
  "workspaces": ["./frontend"],
  "scripts": {
    "dev": "bun --hot src/server.ts",
    "dev:frontend": "cd frontend && vite",
    "build": "cd frontend && vite build",
    "start": "bun src/server.ts"
  },
  "dependencies": {
    "elysia": "^1.4.28",
    "bun:sqlite": "latest"
  }
}
```

### 9.2 前端 package.json (frontend/package.json)

```json
{
  "name": "frontend",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^6.30.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.5.0",
    "typescript": "^5.0.0",
    "vite": "^6.0.0"
  }
}
```

---

## 十、关键技术实现

### 10.1 Vite SSR 数据预取

```typescript
// entry-server.tsx
export async function render(url: string) {
  // 根据路由预取数据
  let data = {};
  if (url === "/") {
    data = await fetchPosts();
  } else if (url.startsWith("/post/")) {
    const slug = url.split("/post/")[1];
    data = await fetchPost(slug);
  }

  return {
    html: renderToString(
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    ),
    data,
  };
}
```

### 10.2 客户端数据获取

```typescript
// pages/Home.tsx
function Home() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // 客户端导航时重新获取数据
    fetch("/api/posts")
      .then((res) => res.json())
      .then(setPosts);
  }, []);

  // ...
}
```

---

## 十一、部署方案

### 11.1 开发环境

```bash
# 终端 1：启动后端
bun run dev

# 终端 2：启动前端
cd frontend && vite
```

### 11.2 生产环境

```bash
# 1. 构建前端
cd frontend && vite build

# 2. 启动后端（静态文件由 Bun 服务）
bun start
```

---

## 总结

本方案通过引入 Vite 解决了 Bun 无法处理浏览器模块加载的问题，同时保持了：

- **Bun 的极速启动**：后端 API 处理
- **Vite 的现代开发体验**：前端开发服务器、HMR、构建优化
- **React Router SSR**：完整的 SSR 支持
- **类型安全**：前后端类型共享

所有代码示例都包含了详细的中文注释，便于后续理解和实现。
