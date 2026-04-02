import { Elysia } from "elysia";
import { renderSSR } from "./ssr/renderer";
import db from "./db";
import { postsRoutes } from "./routes/posts";
import { authRoutes } from "./routes/auth";

const app = new Elysia()
  .decorate("db", db)
  .use(postsRoutes)
  .use(authRoutes)
  .get("*", async ({ request }) => {
    return renderSSR(request);
  })
  .listen(3000);

console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 博客服务器已启动                                      ║
║                                                            ║
║   🌐 本地访问: http://${app.server?.hostname}:${app.server?.port} ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);

export type App = typeof app;
