# 博客项目实施技术方案

## 一、项目概述

基于 Bun、React、Tailwind CSS 和 bun:sqlite 构建的现代化博客系统，支持 SSR（服务端渲染）、文章管理、用户认证、评论系统等功能。

---

## 二、技术栈选择

| 层级         | 技术         | 版本    | 理由                                                 |
| ------------ | ------------ | ------- | ---------------------------------------------------- |
| **运行时**   | Bun          | v1.3.9+ | 极速启动、原生 TypeScript 支持、内置工具链           |
| **Web 框架** | Elysia       | v1.4+   | TypeScript 优先、高性能、类型安全路由、专为 Bun 设计 |
| **数据库**   | bun:sqlite   | -       | 遵循 CLAUDE.md 规则，零配置、高性能                  |
| **前端框架** | React        | v18.x   | 稳定版本、生态完善                                   |
| **渲染方案** | SSR          | -       | 服务端渲染、SEO 优化、首屏加载快                     |
| **样式方案** | Tailwind CSS | v3.x    | 稳定版本、生态成熟                                   |

---

## 三、项目架构设计

### 3.1 目录结构

```
fashion/
├── src/
│   ├── server.ts              # Elysia 服务器入口
│   ├── db/
│   │   ├── index.ts           # bun:sqlite 数据库连接
│   │   ├── schema.ts          # 数据库 Schema 定义
│   │   └── seed.ts            # 初始化数据
│   ├── ssr/
│   │   ├── renderer.ts        # SSR 渲染器
│   │   └── template.html      # HTML 模板
│   ├── routes/
│   │   ├── posts.ts           # 文章路由
│   │   ├── auth.ts            # 认证路由
│   │   └── comments.ts        # 评论路由
│   ├── types/
│   │   └── index.ts           # TypeScript 类型定义
│   └── utils/
│       ├── auth.ts            # 认证工具
│       └── markdown.ts        # Markdown 处理
├── frontend/
│   ├── src/
│   │   ├── entry-client.tsx   # 客户端入口
│   │   ├── entry-server.tsx   # 服务端入口
│   │   ├── App.tsx            # 根组件
│   │   ├── pages/             # 页面组件
│   │   ├── components/        # 通用组件
│   │   └── styles/
│   │       └── global.css     # Tailwind 样式
│   └── index.html
├── public/                     # 静态资源
├── package.json
├── tsconfig.json
└── bun.lockb
```

### 3.2 架构模式

- **简化架构**：不使用 Monorepo，单仓库管理
- **服务端渲染 (SSR)**：Elysia + React SSR
- **前后端同构**：同一套 React 代码在服务端和客户端运行
- **类型共享**：共享类型定义确保端到端类型安全

---

## 四、数据库设计

### 4.1 bun:sqlite Schema

```typescript
/**
 * @file src/db/schema.ts
 * @description 数据库 Schema 定义文件
 * @author 博客项目开发团队
 * @created 2025-04-02
 *
 * 本文件负责定义和初始化博客系统的所有数据库表结构，包括：
 * - users: 用户表
 * - posts: 文章表
 * - tags: 标签表
 * - post_tags: 文章-标签关联表
 * - comments: 评论表
 */

// 导入 bun:sqlite 的 Database 类型
import { Database } from "bun:sqlite";

/**
 * 初始化数据库 Schema
 *
 * @param db - bun:sqlite 数据库实例
 * @description 该函数会创建所有必要的数据库表，如果表已存在则不会重复创建
 *
 * 表结构说明：
 * 1. users - 用户表：存储用户基本信息
 * 2. posts - 文章表：存储文章内容和元数据
 * 3. tags - 标签表：存储文章标签
 * 4. post_tags - 文章标签关联表：实现文章和标签的多对多关系
 * 5. comments - 评论表：存储用户评论，支持多级回复
 */
export function initSchema(db: Database) {
  // 执行 SQL 语句创建所有表
  db.exec(`
    -- 创建用户表：存储博客用户的基本信息
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,      -- 用户唯一标识，自增主键
      username TEXT UNIQUE NOT NULL,             -- 用户名，唯一且不能为空
      email TEXT UNIQUE NOT NULL,                -- 邮箱地址，唯一且不能为空
      password TEXT NOT NULL,                     -- 密码（加密存储）
      avatar TEXT,                                -- 用户头像 URL
      bio TEXT,                                   -- 用户个人简介
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 账户创建时间
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP   -- 信息更新时间
    );

    -- 创建文章表：存储博客文章的内容和元数据
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,      -- 文章唯一标识，自增主键
      title TEXT NOT NULL,                        -- 文章标题
      slug TEXT UNIQUE NOT NULL,                  -- 文章 URL 友好标识，用于 SEO
      content TEXT NOT NULL,                      -- 文章内容（Markdown 格式）
      excerpt TEXT,                               -- 文章摘要
      cover_image TEXT,                           -- 文章封面图片 URL
      published BOOLEAN DEFAULT 0,                -- 发布状态：0=草稿，1=已发布
      author_id INTEGER NOT NULL,                 -- 作者 ID，关联 users 表
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 文章创建时间
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,   -- 文章更新时间
      FOREIGN KEY (author_id) REFERENCES users(id)     -- 外键约束，关联用户表
    );

    -- 创建标签表：存储文章的分类标签
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,      -- 标签唯一标识，自增主键
      name TEXT UNIQUE NOT NULL                   -- 标签名称，唯一
    );

    -- 创建文章-标签关联表：实现文章和标签的多对多关系
    CREATE TABLE IF NOT EXISTS post_tags (
      post_id INTEGER NOT NULL,                   -- 文章 ID
      tag_id INTEGER NOT NULL,                    -- 标签 ID
      PRIMARY KEY (post_id, tag_id),              -- 复合主键：同一文章不能重复添加同一标签
      FOREIGN KEY (post_id) REFERENCES posts(id), -- 外键约束，关联文章表
      FOREIGN KEY (tag_id) REFERENCES tags(id)    -- 外键约束，关联标签表
    );

    -- 创建评论表：存储用户对文章的评论，支持多级回复
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,      -- 评论唯一标识，自增主键
      content TEXT NOT NULL,                      -- 评论内容
      post_id INTEGER NOT NULL,                   -- 被评论的文章 ID
      author_id INTEGER NOT NULL,                 -- 评论作者 ID
      parent_id INTEGER,                          -- 父评论 ID（用于回复功能，NULL 表示顶级评论）
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 评论创建时间
      FOREIGN KEY (post_id) REFERENCES posts(id),     -- 外键约束，关联文章表
      FOREIGN KEY (author_id) REFERENCES users(id),   -- 外键约束，关联用户表
      FOREIGN KEY (parent_id) REFERENCES comments(id) -- 外键约束，关联父评论表（自关联）
    );
  `);
}
```

### 4.2 数据库连接

````typescript
/**
 * @file src/db/index.ts
 * @description bun:sqlite 数据库连接文件
 * @author 博客项目开发团队
 * @created 2025-04-02
 *
 * 本文件负责：
 * - 创建和管理 bun:sqlite 数据库连接
 * - 初始化数据库 Schema
 * - 导出数据库实例供其他模块使用
 *
 * 使用说明：
 * - 其他模块通过 import db from './db' 导入数据库实例
 * - 数据库文件名为 blog.db，会自动创建在项目根目录
 */

// 导入 bun:sqlite 的 Database 类
import { Database } from "bun:sqlite";
// 导入数据库 Schema 初始化函数
import { initSchema } from "./schema";

/**
 * 创建并初始化数据库连接
 *
 * @description
 * 1. 创建或打开名为 blog.db 的 SQLite 数据库文件
 * 2. 调用 initSchema 函数初始化所有数据表
 * 3. 导出数据库实例供全局使用
 *
 * 注意事项：
 * - 如果 blog.db 文件不存在，会自动创建
 * - 如果表已存在，initSchema 不会重复创建
 * - 数据库使用 WAL 模式（Write-Ahead Logging）提高并发性能
 */
const db = new Database("blog.db");

// 启用 WAL 模式以提高并发性能和减少锁竞争
db.exec("PRAGMA journal_mode = WAL");

// 初始化数据库 Schema（创建所有表）
initSchema(db);

/**
 * 导出数据库实例
 *
 * @example
 * ```typescript
 * import db from './db';
 *
 * // 查询所有用户
 * const users = db.prepare("SELECT * FROM users").all();
 *
 * // 插入新文章（使用参数化查询防止 SQL 注入）
 * const stmt = db.prepare("INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)");
 * stmt.run("标题", "内容", 1);
 * ```
 */
export default db;
````

---

## 五、API 接口规范

### 5.1 RESTful API 设计

| 方法     | 路径                      | 描述               |
| -------- | ------------------------- | ------------------ |
| `POST`   | `/api/auth/register`      | 用户注册           |
| `POST`   | `/api/auth/login`         | 用户登录           |
| `GET`    | `/api/posts`              | 获取文章列表       |
| `GET`    | `/api/posts/:id`          | 获取文章详情       |
| `POST`   | `/api/posts`              | 创建文章（需认证） |
| `PUT`    | `/api/posts/:id`          | 更新文章（需认证） |
| `DELETE` | `/api/posts/:id`          | 删除文章（需认证） |
| `GET`    | `/api/posts/:id/comments` | 获取文章评论       |
| `POST`   | `/api/posts/:id/comments` | 发表评论（需认证） |

---

## 六、SSR 实现方案

### 6.1 技术选型

采用 **Elysia + React 18** 组合实现 SSR：

| 技术         | 作用                                                       |
| ------------ | ---------------------------------------------------------- |
| **Bun**      | 运行时，提供极速启动和原生 SSR 支持                        |
| **Elysia**   | Web 框架，处理 API 请求和 SSR 路由、类型安全路由           |
| **React 18** | UI 框架，支持 `renderToString` 和 `renderToPipeableStream` |

### 6.2 核心实现

#### 6.2.1 Elysia 服务器

```typescript
/**
 * @file src/server.ts
 * @description Elysia 服务器入口文件
 * @author 博客项目开发团队
 * @created 2025-04-02
 *
 * 本文件是博客系统的核心服务器文件，负责：
 * - 启动 Elysia HTTP 服务器并监听指定端口
 * - 路由分发：API 请求和 SSR 页面请求
 * - 配置开发环境选项
 * - 注册各种路由插件
 *
 * 服务器架构：
 * - 所有 /api/* 开头的请求由 API 路由处理
 * - 其他所有请求由 SSR 渲染器处理
 * - 使用 Elysia 的装饰器模式组织路由
 */

// 导入 Elysia 框架
import { Elysia } from "elysia";
// 导入 SSR 渲染器函数
import { renderSSR } from "./ssr/renderer";
// 导入数据库实例
import db from "./db";
// 导入文章路由插件
import { postsRoutes } from "./routes/posts";
// 导入认证路由插件
import { authRoutes } from "./routes/auth";

/**
 * 创建并启动 Elysia HTTP 服务器
 *
 * @description
 * Elysia 配置说明：
 * - 通过 .use() 方法注册路由插件
 * - 通过 .get()、.post() 等方法定义路由
 * - 通过 .listen() 启动服务器监听
 *
 * 请求处理流程：
 * 1. 请求首先匹配已注册的 API 路由
 * 2. 如果未匹配到 API 路由，则走通配符路由进行 SSR 渲染
 * 3. 返回完整的 HTML 响应
 */
const app = new Elysia()
  // ========== 注册 API 路由插件 ==========
  // 将数据库实例注入到路由上下文中，所有路由都可以访问
  .decorate("db", db)
  // 注册文章路由（前缀：/api/posts）
  .use(postsRoutes)
  // 注册认证路由（前缀：/api/auth）
  .use(authRoutes)

  // ========== SSR 通配符路由 ==========
  // 匹配所有未被 API 路由捕获的请求
  .get("*", async ({ request }) => {
    // 调用 SSR 渲染器渲染页面
    return renderSSR(request);
  })

  // ========== 启动服务器 ==========
  // 监听 3000 端口
  .listen(3000);

// 输出服务器启动信息
console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 博客服务器已启动                                      ║
║                                                            ║
║   🌐 本地访问: http://${app.server?.hostname}:${app.server?.port} ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);

// 导出 Elysia 应用类型，供前端使用 Eden Treaty 进行类型安全的 API 调用
export type App = typeof app;
```

#### 6.2.2 SSR 渲染器

```typescript
/**
 * @file src/ssr/renderer.ts
 * @description SSR（服务端渲染）渲染器
 * @author 博客项目开发团队
 * @created 2025-04-02
 *
 * 本文件负责服务端渲染 React 应用，核心功能包括：
 * - 将 React 组件渲染为 HTML 字符串
 * - 将渲染结果注入到 HTML 模板中
 * - 返回完整的 HTML 响应给客户端
 *
 * SSR 优势：
 * - 更好的 SEO（搜索引擎优化）
 * - 更快的首屏加载速度
 * - 提升社交媒体分享体验
 */

// 导入 React 用于创建组件
import React from "react";
// 导入 React 服务端渲染函数，将组件渲染为 HTML 字符串
import { renderToString } from "react-dom/server";
// 导入 StaticRouter，用于服务端路由（不依赖浏览器 history）
import { StaticRouter } from "react-router-dom/server";
// 导入 React 应用根组件
import App from "../../frontend/src/App";
// 导入 HTML 模板文件（通过 Bun 的 HTML 导入功能）
import template from "./template.html";

/**
 * SSR 渲染函数
 *
 * @param req - HTTP 请求对象
 * @returns Response - 包含完整 HTML 的响应对象
 *
 * 渲染流程：
 * 1. 从请求中获取 URL 路径
 * 2. 使用 StaticRouter 包裹 React 应用，模拟服务端路由
 * 3. 将 React 应用渲染为 HTML 字符串
 * 4. 将 HTML 字符串注入到模板中的 <!--ssr-outlet--> 位置
 * 5. 返回完整的 HTML 响应
 *
 * 注意事项：
 * - 服务端渲染时不能使用浏览器 API（如 window、document）
 * - 如果需要使用浏览器 API，需要使用 useEffect 或 import.meta.env.SSR 判断
 * - 数据预取应该在服务端完成，避免客户端水合后再次请求
 */
export async function renderSSR(req: Request) {
  // 解析请求 URL
  const url = new URL(req.url);
  // 获取请求路径，用于路由匹配
  const path = url.pathname;

  // ========== React 服务端渲染 ==========
  // 使用 renderToString 将 React 组件渲染为 HTML 字符串
  // StaticRouter 提供服务端路由上下文，location 属性指定当前路由
  const appHtml = renderToString(
    <StaticRouter location={path}>
      <App />
    </StaticRouter>
  );

  // ========== 模板注入 ==========
  // 将渲染好的 React HTML 注入到模板的占位符位置
  // <!--ssr-outlet--> 是模板中的注释标记，用于标记注入位置
  const html = template.replace("<!--ssr-outlet-->", appHtml);

  // ========== 返回响应 ==========
  // 返回完整的 HTML 响应，设置 Content-Type 为 text/html
  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}
```

#### 6.2.3 HTML 模板

```html
<!--
  @file src/ssr/template.html
  @description SSR HTML 模板文件
  @author 博客项目开发团队
  @created 2025-04-02
  
  本文件是服务端渲染的 HTML 模板，负责：
  - 定义页面的基本 HTML 结构
  - 加载静态资源（CSS、JavaScript）
  - 提供 SSR 内容注入位置
  - 设置 SEO 相关 meta 标签
  
  模板说明：
  - <!--ssr-outlet-->
是 SSR 内容注入标记，会被 React 渲染的 HTML 替换 -
<div id="root">
  是 React 应用的挂载点，客户端水合时会使用 - entry-client.tsx
  是客户端入口文件，负责水合 React 应用 -->

  <!DOCTYPE html>
  <!-- 声明文档类型为 HTML5 -->
  <html lang="zh-CN">
    <!-- HTML 根元素，设置语言为简体中文 -->
    <head>
      <!-- 头部区域：包含元数据、样式表等 -->

      <!-- 设置字符编码为 UTF-8，支持中文等 Unicode 字符 -->
      <meta charset="UTF-8" />

      <!-- 视口设置：使页面在移动设备上正确显示 -->
      <!-- width=device-width - 宽度等于设备宽度 -->
      <!-- initial-scale=1.0 - 初始缩放比例为 1 -->
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      <!-- 页面标题：显示在浏览器标签页上 -->
      <title>博客</title>

      <!-- 加载 Tailwind CSS 样式表 -->
      <!-- /public/styles.css 是构建后的 Tailwind CSS 文件 -->
      <link rel="stylesheet" href="/public/styles.css" />
    </head>

    <body>
      <!-- 主体区域：包含页面可见内容 -->

      <!-- React 应用挂载点 -->
      <!-- <!--ssr-outlet-->
      是 SSR 内容注入标记，服务端渲染时会被替换 -->
      <!-- 客户端水合时，React 会接管这个 div 并将其转换为交互式应用 -->
      <div id="root"><!--ssr-outlet--></div>

      <!-- 加载客户端 JavaScript 入口文件 -->
      <!-- type="module" 表示这是一个 ES 模块 -->
      <!-- entry-client.tsx 负责在客户端水合 React 应用 -->
      <script type="module" src="/frontend/src/entry-client.tsx"></script>
    </body>
  </html>
</div>
```

#### 6.2.4 服务端入口

````typescript
/**
 * @file frontend/src/entry-server.tsx
 * @description React 服务端入口文件
 * @author 博客项目开发团队
 * @created 2025-04-02
 *
 * 本文件是 React 应用在服务端的入口点，负责：
 * - 提供服务端渲染函数
 * - 使用 StaticRouter 处理服务端路由
 * - 支持数据预取（可扩展）
 *
 * 与客户端入口的区别：
 * - 服务端使用 StaticRouter 而非 BrowserRouter
 * - 服务端使用 renderToString 而非 createRoot/hydrateRoot
 * - 服务端不能使用浏览器 API（window、document 等）
 */

// 导入 React 用于创建组件
import React from "react";
// 导入 React 服务端渲染函数，将组件渲染为 HTML 字符串
import { renderToString } from "react-dom/server";
// 导入 StaticRouter，用于服务端路由（不依赖浏览器 history API）
import { StaticRouter } from "react-router-dom/server";
// 导入 React 应用根组件
import App from "./App";

/**
 * 服务端渲染函数
 *
 * @param url - 当前请求的 URL 路径（如 /、/post/hello-world）
 * @returns string - 渲染后的 HTML 字符串
 *
 * 渲染流程：
 * 1. 创建 StaticRouter 并传入当前 URL 路径
 * 2. 将 React 应用包裹在 StaticRouter 中
 * 3. 使用 renderToString 将整个组件树渲染为 HTML 字符串
 *
 * 扩展建议：
 * - 可以在此函数中添加数据预取逻辑
 * - 根据 URL 路径预先加载所需数据
 * - 通过 Context 或 props 将数据传递给组件
 *
 * @example
 * ```typescript
 * // 数据预取示例
 * export async function render(url: string) {
 *   const data = await fetchDataForUrl(url);
 *   return renderToString(
 *     <DataProvider value={data}>
 *       <StaticRouter location={url}>
 *         <App />
 *       </StaticRouter>
 *     </DataProvider>
 *   );
 * }
 * ```
 */
export async function render(url: string) {
  // 使用 renderToString 将 React 组件树渲染为 HTML 字符串
  // StaticRouter 提供服务端路由上下文
  // location 属性指定当前路由路径
  return renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>
  );
}
````

#### 6.2.5 客户端入口

```typescript
/**
 * @file frontend/src/entry-client.tsx
 * @description React 客户端入口文件
 * @author 博客项目开发团队
 * @created 2025-04-02
 *
 * 本文件是 React 应用在浏览器端的入口点，负责：
 * - 水合（hydrate）服务端渲染的 HTML
 * - 初始化 React 应用
 * - 设置客户端路由（BrowserRouter）
 * - 将应用变为交互式 SPA
 *
 * 水合（Hydration）说明：
 * - 水合是 React 将服务端渲染的静态 HTML 转换为交互式应用的过程
 * - React 会比对服务端渲染的 HTML 和客户端渲染的结果
 * - 如果不匹配，React 会发出警告并在客户端重新渲染
 *
 * 与服务端入口的区别：
 * - 客户端使用 BrowserRouter 而非 StaticRouter
 * - 客户端使用 hydrateRoot 而非 renderToString
 * - 客户端可以使用浏览器 API（window、document 等）
 */

// 导入 React 用于创建组件
import React from "react";
// 导入 hydrateRoot 函数，用于水合服务端渲染的 HTML
// hydrateRoot 是 React 18 推荐的水合 API
import { hydrateRoot } from "react-dom/client";
// 导入 BrowserRouter，用于客户端路由（使用浏览器 history API）
import { BrowserRouter } from "react-router-dom";
// 导入 React 应用根组件
import App from "./App";

/**
 * 客户端水合入口
 *
 * @description
 * 水合过程：
 * 1. 找到 id 为 "root" 的 DOM 元素（服务端已渲染）
 * 2. 使用 BrowserRouter 包裹应用（提供客户端路由功能）
 * 3. 调用 hydrateRoot 将 React 应用挂载到 DOM 上
 * 4. React 会比对服务端和客户端的渲染结果
 * 5. 水合完成后，应用变为完全交互式的 SPA
 *
 * 注意事项：
 * - 确保服务端和客户端渲染的内容一致
 * - 如果需要条件渲染，使用 import.meta.env.SSR 判断环境
 * - 浏览器 API 应该在 useEffect 中使用，避免水合不匹配
 *
 * 水合不匹配的常见原因：
 * - 服务端和客户端使用了不同的数据
 * - 在服务端使用了浏览器 API
 * - 随机值（如 Math.random()）在服务端和客户端不同
 */
hydrateRoot(
  // 获取 id 为 "root" 的 DOM 元素
  // 这个元素在服务端已经渲染了静态 HTML
  document.getElementById("root")!,

  // 使用 BrowserRouter 包裹应用
  // BrowserRouter 使用浏览器的 history API 管理路由
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
```

---

## 七、分步骤实施计划

### Phase 1: 项目初始化（1 天）

**任务清单：**

- [ ] 初始化 Bun 项目配置
- [ ] 创建基础目录结构
- [ ] 配置 TypeScript
- [ ] 安装依赖包（React、react-dom、react-router-dom、Tailwind CSS）
- [ ] 配置 Tailwind CSS

**验收标准：**

- 项目可以正常启动
- 基础目录结构完整
- TypeScript 编译通过

---

### Phase 2: 数据库设计与初始化（0.5 天）

**任务清单：**

- [ ] 设计数据库 Schema（users、posts、tags、comments）
- [ ] 实现 bun:sqlite 连接
- [ ] 创建数据库初始化脚本
- [ ] 创建种子数据脚本
- [ ] 编写数据库 CRUD 基础函数

**验收标准：**

- 数据库可以正常创建和连接
- Schema 创建成功
- 种子数据可以正常插入
- 基础 CRUD 函数测试通过

---

### Phase 3: 后端 API 开发（2 天）

**任务清单：**

- [ ] 实现用户认证 API（注册、登录）
- [ ] 实现 JWT 认证中间件
- [ ] 实现文章 CRUD API
- [ ] 实现评论 API
- [ ] 实现标签 API
- [ ] API 接口测试

**验收标准：**

- 所有 API 接口正常工作
- 认证功能正常
- 数据验证正确
- API 响应格式统一

---

### Phase 4: SSR 集成（1 天）

**任务清单：**

- [ ] 实现 Elysia 服务器
- [ ] 实现 SSR 渲染器
- [ ] 配置 Elysia 路由
- [ ] 实现客户端水合
- [ ] 静态资源服务配置

**验收标准：**

- SSR 正常工作
- 服务端渲染的 HTML 正确
- 客户端水合成功
- 页面可以正常交互

---

### Phase 5: 前端页面开发（2 天）

**任务清单：**

- [ ] 实现基础布局组件（Header、Footer）
- [ ] 实现首页（文章列表、热门文章）
- [ ] 实现文章详情页
- [ ] 实现登录/注册页
- [ ] 实现用户中心页
- [ ] 实现管理后台页面

**验收标准：**

- 所有页面正常显示
- 路由导航正常
- 响应式布局正常
- 与后端 API 正常交互

---

### Phase 6: 功能完善与优化（1.5 天）

**任务清单：**

- [ ] 实现 Markdown 编辑器
- [ ] 实现图片上传功能
- [ ] 实现评论系统
- [ ] SEO 优化（meta 标签、sitemap）
- 性能优化（缓存、懒加载）
- 错误处理优化

**验收标准：**

- 所有功能正常工作
- Markdown 渲染正确
- 图片上传正常
- SEO 标签正确

---

### Phase 7: 测试与部署（1 天）

**任务清单：**

- [ ] 编写单元测试
- [ ] 编写集成测试
- [ ] 手动功能测试
- [ ] Bug 修复
- [ ] 部署配置
- [ ] 生产环境测试

**验收标准：**

- 测试通过率 90%+
- 无严重 Bug
- 生产环境正常运行

---

**总计时间：9 天**

---

## 八、前端页面结构

### 8.1 页面路由

```
/                    - 首页
/post/:slug          - 文章详情
/tags                - 标签页
/auth/login          - 登录页
/auth/register       - 注册页
/admin               - 管理后台
/admin/posts         - 文章管理
/admin/posts/new     - 新建文章
```

### 8.2 组件结构

```
frontend/src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Sidebar.tsx
│   ├── posts/
│   │   ├── PostCard.tsx
│   │   ├── PostList.tsx
│   │   └── MarkdownRenderer.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   └── editor/
│       └── MarkdownEditor.tsx
├── pages/
│   ├── Home.tsx
│   ├── PostDetail.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   └── Admin.tsx
└── App.tsx
```

---

## 九、关键技术实现

### 9.1 Elysia 路由示例

```typescript
/**
 * @file src/routes/posts.ts
 * @description 文章路由模块（Elysia 插件）
 * @author 博客项目开发团队
 * @created 2025-04-02
 *
 * 本模块负责定义所有与文章相关的 API 路由：
 * - GET /api/posts - 获取已发布的文章列表
 * - GET /api/posts/:id - 获取单篇文章详情
 * - POST /api/posts - 创建新文章（需认证）
 * - PUT /api/posts/:id - 更新文章（需认证）
 * - DELETE /api/posts/:id - 删除文章（需认证）
 *
 * Elysia 插件模式优势：
 * - 路由模块化，便于维护
 * - 自动类型推导，类型安全
 * - 支持路由前缀，避免路由冲突
 * - 通过上下文共享数据库等依赖
 */

// 导入 Elysia 和类型定义工具
import { Elysia, t } from "elysia";
// 导入 bun:sqlite 的 Database 类型
import type { Database } from "bun:sqlite";

/**
 * 文章路由插件
 *
 * @description
 * 使用 Elysia 的插件模式定义文章相关路由
 * prefix: /api/posts - 所有路由的前缀
 *
 * 路由说明：
 * - db 通过 .decorate() 注入到上下文中
 * - params 通过 t.Object() 进行类型验证
 * - body 通过 t.Object() 进行类型验证
 * - 所有路由自动类型安全
 *
 * @returns Elysia - 配置好的文章路由插件
 */
export const postsRoutes = new Elysia({ prefix: "/api/posts" })
  // ========== 获取文章列表 ==========
  // 接口：GET /api/posts
  .get(
    "/",
    /**
     * 获取所有已发布的文章列表
     *
     * @param db - 数据库实例（通过上下文注入）
     * @returns Array - 文章列表数组
     * @description
     * 只返回 published = 1 的文章（已发布）
     * 按创建时间倒序排列（最新的在前）
     */
    async ({ db }) => {
      // 预编译 SQL 查询语句，只查询已发布的文章
      // 使用 prepare() 预编译可以提高性能，避免重复解析 SQL
      const stmt = db.prepare(
        "SELECT * FROM posts WHERE published = 1 ORDER BY created_at DESC",
      );
      // 执行查询，获取所有结果
      const posts = stmt.all();

      // 直接返回数据，Elysia 会自动转换为 JSON 响应
      return posts;
    },
  )

  // ========== 获取单篇文章详情 ==========
  // 接口：GET /api/posts/:id
  .get(
    "/:id",
    /**
     * 根据 ID 获取单篇文章详情
     *
     * @param db - 数据库实例（通过上下文注入）
     * @param params - 路由参数对象
     * @param params.id - 文章 ID（字符串类型）
     * @returns Object - 文章详情对象
     * @throws 404 - 文章不存在时返回
     */
    async ({ db, params }) => {
      // 使用参数化查询防止 SQL 注入
      // ? 是参数占位符，在 run()/get()/all() 时传入实际值
      const stmt = db.prepare("SELECT * FROM posts WHERE id = ?");
      // 执行查询，获取单条结果
      const post = stmt.get(params.id);

      if (!post) {
        // 文章不存在，抛出错误，Elysia 会自动设置 404 状态码
        throw new Error("Post not found");
      }

      // 返回文章数据
      return post;
    },
    {
      // 使用 t.Object() 定义 params 的类型和验证规则
      params: t.Object({
        id: t.String(), // id 必须是字符串类型
      }),
    },
  )

  // ========== 创建新文章 ==========
  // 接口：POST /api/posts
  .post(
    "/",
    /**
     * 创建新文章
     *
     * @param db - 数据库实例（通过上下文注入）
     * @param body - 请求体对象（已通过类型验证）
     * @returns Object - 创建成功的文章对象
     * @description
     * TODO: 需要添加认证中间件，验证用户身份
     * TODO: 需要生成唯一的 slug
     * TODO: 需要验证数据完整性
     */
    async ({ db, body }) => {
      // 使用参数化查询插入新文章
      const stmt = db.prepare(`
        INSERT INTO posts (title, slug, content, excerpt, cover_image, published, author_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      // TODO: 这里需要从认证上下文中获取当前用户 ID
      const authorId = 1;
      // TODO: 这里需要生成唯一的 slug
      const slug = body.title.toLowerCase().replace(/\s+/g, "-");

      // 执行插入操作
      const result = stmt.run(
        body.title,
        slug,
        body.content,
        body.excerpt || "",
        body.coverImage || "",
        body.published ? 1 : 0,
        authorId,
      );

      // 查询刚创建的文章并返回
      const newPost = db
        .prepare("SELECT * FROM posts WHERE id = ?")
        .get(result.lastInsertRowid);
      return newPost;
    },
    {
      // 使用 t.Object() 定义 body 的类型和验证规则
      body: t.Object({
        title: t.String(), // 标题必须是字符串
        content: t.String(), // 内容必须是字符串
        excerpt: t.Optional(t.String()), // 摘要可选
        coverImage: t.Optional(t.String()), // 封面图片可选
        published: t.Optional(t.Boolean()), // 发布状态可选，默认为 false
      }),
    },
  )

  // ========== 更新文章 ==========
  // 接口：PUT /api/posts/:id
  .put(
    "/:id",
    /**
     * 更新文章
     *
     * @param db - 数据库实例（通过上下文注入）
     * @param params - 路由参数对象
     * @param body - 请求体对象
     * @returns Object - 更新后的文章对象
     * @description
     * TODO: 需要添加认证中间件，验证用户是否是文章作者
     */
    async ({ db, params, body }) => {
      // 先检查文章是否存在
      const checkStmt = db.prepare("SELECT * FROM posts WHERE id = ?");
      const post = checkStmt.get(params.id);

      if (!post) {
        throw new Error("Post not found");
      }

      // 更新文章（只更新提供的字段）
      const updateStmt = db.prepare(`
        UPDATE posts 
        SET title = COALESCE(?, title),
            content = COALESCE(?, content),
            excerpt = COALESCE(?, excerpt),
            cover_image = COALESCE(?, cover_image),
            published = COALESCE(?, published),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      updateStmt.run(
        body.title,
        body.content,
        body.excerpt,
        body.coverImage,
        body.published ? 1 : null,
        params.id,
      );

      // 查询更新后的文章并返回
      const updatedPost = db
        .prepare("SELECT * FROM posts WHERE id = ?")
        .get(params.id);
      return updatedPost;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        title: t.Optional(t.String()),
        content: t.Optional(t.String()),
        excerpt: t.Optional(t.String()),
        coverImage: t.Optional(t.String()),
        published: t.Optional(t.Boolean()),
      }),
    },
  )

  // ========== 删除文章 ==========
  // 接口：DELETE /api/posts/:id
  .delete(
    "/:id",
    /**
     * 删除文章
     *
     * @param db - 数据库实例（通过上下文注入）
     * @param params - 路由参数对象
     * @returns Object - 删除成功消息
     * @description
     * TODO: 需要添加认证中间件，验证用户是否是文章作者
     * TODO: 需要级联删除相关的评论和标签关联
     */
    async ({ db, params }) => {
      // 先检查文章是否存在
      const checkStmt = db.prepare("SELECT * FROM posts WHERE id = ?");
      const post = checkStmt.get(params.id);

      if (!post) {
        throw new Error("Post not found");
      }

      // 删除文章
      const deleteStmt = db.prepare("DELETE FROM posts WHERE id = ?");
      deleteStmt.run(params.id);

      // 返回成功消息
      return { success: true, message: "Post deleted successfully" };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  );
```

### 9.2 Tailwind CSS 配置

````css
/**
 * @file frontend/src/styles/global.css
 * @description Tailwind CSS 全局样式文件
 * @author 博客项目开发团队
 * @created 2025-04-02
 * 
 * 本文件是 Tailwind CSS 的入口文件，负责：
 * - 导入 Tailwind 的基础、组件和工具样式
 * - 定义自定义主题和样式
 * - 配置全局样式规则
 * 
 * Tailwind CSS 工作原理：
 * - Tailwind 是一个 utility-first CSS 框架
 * - 通过类名组合来构建样式
 * - 在构建时会根据使用的类名生成最终的 CSS
 * 
 * 使用说明：
 * - @tailwind 指令导入 Tailwind 的三个核心部分
 * - @layer 指令可以向特定层级添加自定义样式
 * - @theme 指令（Tailwind v4）可以定义主题变量
 */

/* ========== Tailwind CSS 核心导入 ========== */

/**
 * @tailwind base
 * 导入 Tailwind 的基础样式
 * 包含：Normalize.css、HTML 元素默认样式
 * 相当于 CSS 重置，确保跨浏览器一致性
 */
@tailwind base;

/**
 * @tailwind components
 * 导入 Tailwind 的组件类
 * 包含：预定义的组件样式（如 btn、card 等）
 * 可以通过 @layer components 扩展自定义组件
 */
@tailwind components;

/**
 * @tailwind utilities
 * 导入 Tailwind 的工具类
 * 包含：所有 utility 类（如 p-4、text-center、bg-blue-500 等）
 * 这是 Tailwind 最核心的部分
 */
@tailwind utilities;

/* ========== 自定义基础样式 ========== */

/**
 * @layer base
 * 向 base 层级添加自定义样式
 * base 层级的样式会在组件和工具类之前加载
 * 适合定义 HTML 元素的默认样式
 */
@layer base {
  /**
   * body 元素全局样式
   * 
   * @apply font-sans - 应用 Tailwind 的 sans-serif 字体栈
   * 字体栈包含：Inter、system-ui、-apple-system、BlinkMacSystemFont 等
   * 确保在不同操作系统和浏览器上都有良好的显示效果
   */
  body {
    @apply font-sans;
  }

  /**
   * 可以继续添加其他基础样式
   * 
   * @example
   * ```css
   * h1 {
   *   @apply text-3xl font-bold mb-4;
   * }
   * 
   * a {
   *   @apply text-blue-600 hover:text-blue-800;
   * }
   * ```
   */
}

/* ========== 自定义组件样式 ========== */

/**
 * @layer components
 * 向 components 层级添加自定义组件样式
 * components 层级在 base 之后、utilities 之前加载
 * 适合定义可复用的组件类
 * 
 * @example
 * ```css
 * .btn {
 *   @apply px-4 py-2 rounded-lg font-medium;
 * }
 * 
 * .btn-primary {
 *   @apply btn bg-blue-600 text-white hover:bg-blue-700;
 * }
 * ```
 */
@layer components {
  /* 可以在此添加自定义组件类 */
}

/* ========== 自定义工具类 ========== */

/**
 * @layer utilities
 * 向 utilities 层级添加自定义工具类
 * utilities 层级最后加载，优先级最高
 * 适合定义项目特定的工具类
 * 
 * @example
 * ```css
 * .content-auto {
 *   content-visibility: auto;
 * }
 * 
 * .text-shadow {
 *   text-shadow: 0 2px 4px rgba(0,0,0,0.1);
 * }
 * ```
 */
@layer utilities {
  /* 可以在此添加自定义工具类 */
}
````

---

## 十、安全措施

| 方面     | 措施                                     |
| -------- | ---------------------------------------- |
| **认证** | JWT + HTTP-only Cookie                   |
| **密码** | bcrypt 加密                              |
| **输入** | 数据验证、SQL 注入防护（使用参数化查询） |
| **XSS**  | 内容转义、CSP 头                         |

---

## 十一、开发脚本与依赖

### 11.1 开发脚本

```json
{
  "scripts": {
    "dev": "bun --hot src/server.ts",
    "build": "bun build src/server.ts",
    "start": "bun src/server.ts"
  }
}
```

### 11.2 核心依赖

需要安装的核心依赖包：

```bash
# 安装 Elysia 和相关依赖
bun add elysia

# 安装前端依赖
bun add react react-dom react-router-dom

# 安装开发依赖
bun add -d typescript @types/react @types/react-dom tailwindcss
```

### 11.3 Eden Treaty 类型安全（可选）

如果需要前端类型安全的 API 调用，可以使用 Eden Treaty：

```typescript
// 前端使用示例
import { treaty } from "@elysiajs/eden";
import type { App } from "../src/server";

// 创建类型安全的 API 客户端
const api = treaty<App>("http://localhost:3000");

// 完全类型安全的 API 调用
const { data: posts } = await api.posts.get();
const { data: post } = await api.posts({ id: "1" }).get();
```

---

## 总结

本方案使用 Elysia 作为 Web 框架，bun:sqlite 作为数据库，同时保持 SSR 方案。采用简化架构，避免过度设计，分 7 个阶段实施，总计 9 天完成 MVP 版本。

Elysia 的核心优势：

- **TypeScript 优先**：端到端类型安全，自动类型推导
- **高性能**：专为 Bun 设计，性能最优
- **插件化架构**：路由模块化，易于维护和扩展
- **类型验证**：内置 t 类型验证器，自动验证请求参数和响应
- **Eden Treaty**：支持类型安全的前端 API 调用

所有代码示例都包含了详细的中文注释，便于后续 AI 理解和实现。
