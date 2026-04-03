/**
 * @file 服务端渲染器
 * @description 处理 SSR 请求，将 React 组件渲染为 HTML 字符串
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "../../frontend/src/App";
import { setSSRData } from "../../frontend/src/ssrData";
import db from "../db";
import type { Post, SSRData } from "../types";

const CACHE_TTL = 60000;
const ssrCache = new Map<string, { data: SSRData; timestamp: number }>();

function getCachedData(key: string): SSRData | null {
  const cached = ssrCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  ssrCache.delete(key);
  return null;
}

function setCachedData(key: string, data: SSRData): void {
  if (ssrCache.size > 100) {
    const firstKey = ssrCache.keys().next().value;
    if (firstKey) ssrCache.delete(firstKey);
  }
  ssrCache.set(key, { data, timestamp: Date.now() });
}

async function fetchSSRData(url: string): Promise<SSRData> {
  const cached = getCachedData(url);
  if (cached) return cached;

  const data: SSRData = {};

  if (url === "/" || url === "") {
    const postsStmt = db.prepare(`
      SELECT p.*, GROUP_CONCAT(t.id) as tag_ids, GROUP_CONCAT(t.name) as tag_names, GROUP_CONCAT(t.color) as tag_colors
      FROM posts p
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON t.id = pt.tag_id
      WHERE p.published = 1
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    const posts = postsStmt.all() as (Post & {
      tag_ids: string | null;
      tag_names: string | null;
      tag_colors: string | null;
    })[];
    data.posts = posts.map((post) => {
      const tagIds = post.tag_ids ? post.tag_ids.split(",").map(Number) : [];
      const tagNames = post.tag_names ? post.tag_names.split(",") : [];
      const tagColors = post.tag_colors ? post.tag_colors.split(",") : [];
      return {
        ...post,
        tags: tagIds.map((id, index) => ({
          id,
          name: tagNames[index],
          color: tagColors[index],
        })),
      };
    });
  } else if (url.startsWith("/post/")) {
    const slug = url.split("/post/")[1];
    const postStmt = db.prepare(`
      SELECT p.*, GROUP_CONCAT(t.id) as tag_ids, GROUP_CONCAT(t.name) as tag_names, GROUP_CONCAT(t.color) as tag_colors
      FROM posts p
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON t.id = pt.tag_id
      WHERE p.slug = ?
      GROUP BY p.id
    `);
    const posts = postStmt.all(slug as string) as (Post & {
      tag_ids: string | null;
      tag_names: string | null;
      tag_colors: string | null;
    })[];
    if (posts.length > 0) {
      const post = posts[0];
      const tagIds = post.tag_ids ? post.tag_ids.split(",").map(Number) : [];
      const tagNames = post.tag_names ? post.tag_names.split(",") : [];
      const tagColors = post.tag_colors ? post.tag_colors.split(",") : [];
      data.post = {
        ...post,
        tags: tagIds.map((id, index) => ({
          id,
          name: tagNames[index],
          color: tagColors[index],
        })),
      };
    }
  }

  setCachedData(url, data);
  return data;
}

export async function renderSSR(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname;

  const ssrData = await fetchSSRData(path);
  setSSRData(ssrData);

  const appHtml = renderToString(
    <StaticRouter location={path}>
      <App />
    </StaticRouter>,
  );

  let title = "我的博客";
  let description = "分享技术，记录成长";
  let ogImage = "";

  if (ssrData.post) {
    title = `${ssrData.post.title} - 我的博客`;
    description = ssrData.post.excerpt || description;
    ogImage = ssrData.post.cover_image || "";
  }

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />

    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    ${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />` : ""}

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    ${ogImage ? `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />` : ""}

    <script>
      (function() {
        const theme = localStorage.getItem('theme');
        if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
        }
      })();
    </script>

    <script>
      window.__SSR_DATA__ = ${JSON.stringify(ssrData)};
    </script>
  </head>
  <body class="min-h-screen bg-gray-50">
    <div id="root">${appHtml}</div>
    <script type="module" crossorigin src="/assets/main-Cg-Vto7n.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/main-DYhNQTr0.css">
  </body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m] || m);
}