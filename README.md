# Fashion Blog

一个基于现代技术栈构建的高性能博客系统，支持服务端渲染、用户认证、Markdown 编辑和标签管理。

## 项目概述

Fashion Blog 是一个采用 Bun、Elysia、React 和 TypeScript 构建的全栈博客平台。系统采用服务端渲染技术以优化 SEO 和首屏加载性能，同时提供了完善的用户认证系统、丰富的文章管理功能和美观的响应式界面设计。

该项目旨在展示如何运用现代化的 JavaScript 生态系统构建一个生产级别的博客应用。核心技术选型注重性能与开发者体验的平衡，使用 Bun 作为运行时以获得极致的启动速度和执行效率，采用 Elysia 框架享受 TypeScript 优先的开发模式，前端则使用 React 配合 Vite 实现快速的开发热更新和优化的生产构建。

## 技术架构

### 后端技术栈

后端服务基于 Bun 运行时构建，使用 Elysia 作为 Web 框架。Elysia 是一个专为 TypeScript 设计的框架，提供了出色的类型安全和直观的 API 设计。数据库采用 SQLite，通过 bun:sqlite 模块提供了高性能的本地存储能力。认证机制使用 JWT（JSON Web Token）配合 bcrypt 密码哈希，确保用户数据安全。前后端通信采用 RESTful API 设计风格，路由模块化组织便于维护和扩展。

服务端渲染模块实现了完整的 SSR 能力，通过 React 的 renderToString 方法将 React 组件在服务端渲染为 HTML 字符串。为了优化性能，系统内置了 LRU 缓存机制，缓存时长设置为 60 秒，有效减少了重复请求对数据库的压力。

### 前端技术栈

前端界面使用 React 18 构建，配合 TypeScript 提供完整的类型安全保障。Vite 作为构建工具，提供了极快的冷启动速度和高效的模块热替换能力。样式方面采用 Tailwind CSS，通过实用优先的 CSS 方式实现了精美且一致的用户界面设计。

路由管理使用 React Router DOM v6，采用了集中式路由配置模式，所有路由路径统一定义在 routes.ts 文件中，避免了硬编码字符串带来的维护问题。状态管理方面，认证状态和主题设置通过 React Context API 进行管理，提供了简洁而有效的全局状态共享方案。

### 代码质量工具

代码格式化和代码检查使用 Biome。Biome 是一个高性能的 JavaScript 和 TypeScript 工具链，提供了格式化、Lint 和其他代码质量功能，相比传统工具拥有更快的执行速度。项目配置了自动化的格式化和检查脚本，确保代码风格的一致性。

## 项目结构

```
fashion
├── src/                          # 后端源代码
│   ├── db/                       # 数据库相关
│   │   ├── index.ts              # 数据库连接初始化
│   │   ├── schema.ts             # 数据表结构定义
│   │   ├── seed.ts               # 初始数据播种
│   │   └── queries/              # 数据库查询模块
│   │       └── posts.ts          # 文章查询函数
│   ├── routes/                   # API 路由
│   │   ├── auth.ts              # 认证相关路由
│   │   ├── posts.ts             # 文章 CRUD 路由
│   │   ├── comments.ts          # 评论路由
│   │   ├── tags.ts              # 标签管理路由
│   │   ├── upload.ts            # 文件上传路由
│   │   └── stats.ts             # 统计信息路由
│   ├── ssr/                      # 服务端渲染
│   │   ├── renderer.tsx         # SSR 渲染器
│   │   └── template.html        # HTML 模板
│   ├── types/                    # TypeScript 类型定义
│   │   └── index.ts             # 核心类型声明
│   ├── utils/                    # 工具函数
│   │   └── env.ts               # 环境变量工具
│   └── server.ts                # 服务器入口
├── frontend/                     # 前端源代码
│   ├── src/
│   │   ├── components/          # React 组件
│   │   ├── contexts/            # React Context
│   │   ├── hooks/               # 自定义 Hooks
│   │   ├── pages/               # 页面组件
│   │   ├── styles/              # 全局样式
│   │   ├── utils/               # 工具函数
│   │   ├── App.tsx              # 应用根组件
│   │   ├── routes.ts            # 路由配置
│   │   └── main.tsx             # 前端入口
│   ├── tests/                   # 前端测试
│   ├── package.json             # 前端依赖配置
│   └── vite.config.ts          # Vite 配置
├── scripts/                      # 构建脚本
│   └── update-renderer.js      # 渲染资源更新脚本
├── docs/                         # 项目文档
├── package.json                  # 根目录依赖配置
└── biome.json                    # Biome 配置
```

## 核心功能

### 用户认证系统

系统提供了完整的用户认证功能，包括用户注册和登录两个核心流程。用户注册时，密码会通过 bcrypt 算法进行哈希处理，盐值轮数设为 10，在安全性和性能之间取得平衡。登录成功后，系统会签发 JWT token，客户端通过该 token 访问需要认证的 API 接口。

获取当前用户信息的接口会验证请求头中的 Bearer token，解析并验证 token 的有效性后返回用户详细信息。认证状态在前端通过 AuthContext 进行管理，提供了登录状态判断、当前用户信息获取和退出登录等功能。

### 文章管理

文章模块支持完整的 CRUD 操作。每篇文章都有唯一的 slug 字段，用于生成友好的 URL 地址。系统支持文章的发布状态管理，可以将文章设为草稿或已发布状态。标签关联功能允许在为文章创建或更新时同时管理其关联的标签，支持多标签关联。

文章列表接口使用了高效的 SQL 查询，通过 LEFT JOIN 同时获取文章及其关联的标签信息，避免了 N+1 查询问题。文章详情接口支持通过 ID 或 slug 两种方式进行查询，提供了灵活的访问方式。

### 标签系统

标签系统允许创建带有颜色属性的标签，每种标签都可以指定一个十六进制颜色代码。标签管理接口支持创建、查询标签，并自动计算每个标签关联的文章数量。标签颜色在前端展示时，会根据背景色的深浅自动计算对比色，确保文字的可读性。

### 评论功能

评论系统支持嵌套回复功能，每条评论可以指定一个父评论 ID 来建立回复关系。顶级评论的 parent_id 字段为空，回复评论则通过该字段关联到被回复的评论。评论接口提供了创建、查询和删除操作，与文章类似采用了关联表设计。

### 主题切换

系统支持明暗两种主题模式，主题设置会保存在 localStorage 中。服务端渲染时会读取 cookie 中的主题设置，在 HTML 标签上添加相应的 class，确保页面首次加载时即使用户之前选择了深色主题，也不会出现闪烁现象。ThemeToggle 组件允许用户随时切换主题，切换结果会同步保存到 localStorage 和 cookie。

## 安装部署

### 环境要求

运行本项目需要安装 Bun 运行时。Bun 是一个现代化的 JavaScript 运行时，提供了比 Node.js 更快的启动速度和执行效率。请访问 Bun 官方网站获取安装说明。

### 依赖安装

在项目根目录下执行以下命令安装所有依赖：

```bash
bun install
```

该命令会根据根目录的 package.json 和 frontend/package.json 自动安装前后端的所有依赖。项目采用了 workspaces 模式，frontend 目录作为子工作区被管理。

### 环境配置

项目提供了环境变量配置文件模板。复制 .env.example 文件并重命名为 .env，然后根据实际情况修改配置值：

```bash
cp .env.example .env
```

主要配置项说明如下。JWT_SECRET 是用于签发 JWT token 的密钥，生产环境务必设置为一个复杂且唯一的字符串。NODE_ENV 设置运行环境，可选值为 development 或 production。

### 启动开发服务器

开发环境下，前后端可以分别独立启动。后端服务监听 3000 端口，提供 API 和 SSR 渲染服务：

```bash
bun run dev
```

前端开发服务器可以单独启动，支持热模块替换：

```bash
bun run dev:frontend
```

或者直接使用 bun 的工作区命令：

```bash
bun --hot src/server.ts
```

### 生产构建

构建生产版本前，需要先构建前端资源：

```bash
bun run build
```

该命令会进入 frontend 目录执行 Vite 构建，然后运行 update-renderer.js 脚本更新服务端渲染资源。构建完成后，使用以下命令启动生产服务器：

```bash
bun run start
```

## 使用指南

### 访问博客

启动服务器后，在浏览器中访问 http://localhost:3000 即可看到博客首页。首页展示了所有已发布的文章列表，每篇文章显示标题、摘要、封面图片和关联标签。

### 用户注册与登录

点击导航栏的"注册"按钮创建新账号。注册信息包括用户名、邮箱和密码。注册成功后系统会自动登录，并返回 JWT token。已有账号的用户可以点击"登录"按钮使用邮箱和密码登录。

### 管理后台

登录后，导航栏会显示"管理后台"链接。管理后台提供了文章管理、标签管理和个人信息查看等功能。只有登录用户才能访问管理后台。

### 创建和管理文章

在管理后台可以创建新文章或编辑现有文章。文章编辑器支持 Markdown 格式，可以添加标题、正文内容和摘要。创建文章时可以同时选择关联的标签。设置"已发布"状态后，文章会出现在博客首页。

### 主题切换

点击导航栏中的主题切换按钮，可以在明暗主题之间切换。主题偏好会保存到浏览器本地存储，下次访问时会自动应用上次选择的主题。

## 开发规范

### 代码格式化

项目使用 Biome 进行代码格式化。检查代码格式：

```bash
bun run fmt:check
```

自动修复格式问题：

```bash
bun run fmt
```

### 代码检查

运行 Linter 检查代码质量：

```bash
bun run lint
```

自动修复可自动解决的 Lint 问题：

```bash
bun run lint:fix
```

### 代码注释规范

中文注释规范遵循 docs/代码中文注释规范.md 中的定义。注释应该清晰描述代码的功能、参数和返回值，避免冗余或显而易见的说明。

## 数据库结构

系统使用 SQLite 数据库，包含以下数据表。用户表存储用户账号信息，密码字段保存的是 bcrypt 哈希值。文章表存储博客文章内容，slug 字段用于生成友好的 URL。标签表存储标签名称和颜色。评论表支持嵌套回复，通过 parent_id 字段建立层级关系。

表之间通过外键建立关联：posts 表的 author_id 关联 users 表的 id，comments 表的 post_id 和 author_id 分别关联对应的表，post_tags 表作为中间表建立了 posts 表和 tags 表的多对多关系。

## API 路由

### 认证相关

用户注册接口为 POST /api/auth/register，接收 username、email 和 password 参数。用户登录接口为 POST /api/auth/login，接收 email 和 password 参数，登录成功返回用户信息和 JWT token。获取当前用户信息接口为 GET /api/auth/me，需要在请求头中携带 Bearer token。

### 文章相关

获取所有已发布文章列表为 GET /api/posts。获取单篇文章详情为 GET /api/posts/:idOrSlug，支持数字 ID 或 slug 字符串。创建新文章为 POST /api/posts，需要认证。更新文章为 PUT /api/posts/:id。删除文章为 DELETE /api/posts/:id。

### 其他接口

评论相关接口的前缀为 /api/comments。标签相关接口的前缀为 /api/tags。文件上传接口前缀为 /api/upload。统计信息接口前缀为 /api/stats。

## License

本项目采用 MIT 许可证开源。

## 联系方式

如有问题或建议，欢迎通过 GitHub Issues 与我们联系。
