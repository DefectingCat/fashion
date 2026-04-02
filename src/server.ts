import { Elysia } from "elysia";
import { renderSSR } from "./ssr/renderer.tsx";
import db from "./db";
import { postsRoutes } from "./routes/posts";
import { authRoutes } from "./routes/auth";
import { commentsRoutes } from "./routes/comments";
import { tagsRoutes } from "./routes/tags";
import { uploadRoutes } from "./routes/upload";
import { seedDatabase } from "./db/seed";

async function start() {
  await seedDatabase();

  const app = new Elysia()
    .decorate("db", db)
    .use(postsRoutes)
    .use(authRoutes)
    .use(commentsRoutes)
    .use(tagsRoutes)
    .use(uploadRoutes)
    .get("/public/*", async ({ params }) => {
      const file = Bun.file(`./public/${params["*"]}`);
      if (await file.exists()) {
        return new Response(file);
      }
      return new Response("Not found", { status: 404 });
    })
    .get("/frontend/*", async ({ params }) => {
      const file = Bun.file(`./frontend/${params["*"]}`);
      if (await file.exists()) {
        return new Response(file);
      }
      return new Response("Not found", { status: 404 });
    })
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

  return app;
}

start().catch(console.error);

export type App = typeof start extends () => Promise<infer T> ? T : never;
