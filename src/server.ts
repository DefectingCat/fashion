/**
 * @file 博客服务器入口
 * @description 初始化并启动 Elysia Web 服务器，注册所有路由和中间件
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import { Elysia } from "elysia";
import { renderSSR } from "./ssr/renderer.tsx";
import db from "./db";
import { postsRoutes } from "./routes/posts";
import { authRoutes } from "./routes/auth";
import { commentsRoutes } from "./routes/comments";
import { tagsRoutes } from "./routes/tags";
import { uploadRoutes } from "./routes/upload";
import { seedDatabase } from "./db/seed";

/**
 * 启动博客服务器
 *
 * 初始化数据库、注册路由、启动 HTTP 服务
 *
 * @returns Elysia 应用实例
 */
async function start() {
  // 播种数据库初始数据
  await seedDatabase();

  // 创建 Elysia 应用实例
  const app = new Elysia()
    // 装饰数据库实例，使其在所有路由中可用
    .decorate("db", db)
    // 注册文章相关路由
    .use(postsRoutes(db))
    // 注册认证相关路由
    .use(authRoutes(db))
    // 注册评论相关路由
    .use(commentsRoutes(db))
    // 注册标签相关路由
    .use(tagsRoutes(db))
    // 注册文件上传路由
    .use(uploadRoutes(db))
    // 静态文件服务：public 目录
    .get("/public/*", async ({ params }) => {
      const file = Bun.file(`./public/${params["*"]}`);
      if (await file.exists()) {
        return new Response(file);
      }
      return new Response("Not found", { status: 404 });
    })
    // 静态文件服务：前端构建资源
    .get("/assets/*", async ({ params }) => {
      const file = Bun.file(`./dist/client/assets/${params["*"]}`);
      if (await file.exists()) {
        return new Response(file);
      }
      return new Response("Not found", { status: 404 });
    })
    // 服务端渲染所有其他路由
    .get("*", async ({ request }) => {
      return renderSSR(request);
    })
    // 监听 3000 端口
    .listen(3000);

  // 打印服务器启动信息
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 博客服务器已启动                                      ║
║                                                            ║
║   🌐 本地访问: http://${app.server?.hostname}:${app.server?.port} ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);

  return app;
}

// 启动服务器
start().catch(console.error);

/**
 * Elysia 应用类型
 *
 * 用于类型提示，获取 app 实例的完整类型
 */
export type App = typeof start extends () => Promise<infer T> ? T : never;
