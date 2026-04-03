/**
 * @file 服务端渲染器
 * @description 处理 SSR 请求，将 React 组件渲染为 HTML 字符串
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "../../frontend/src/App";
import { setSSRData } from "../../frontend/src/ssrData";
import db from "../db";
import { getAllPublishedPosts, getPostBySlug } from "../db/queries/posts";
import type { SSRData } from "../types";

const CACHE_TTL = 60000;
const ssrCache = new Map<string, { data: SSRData; timestamp: number }>();

interface AssetManifest {
  js: string;
  css: string;
}

function getAssetManifest(): AssetManifest {
  const assetsDir = resolve(process.cwd(), "dist/client/assets");
  const manifestPath = join(assetsDir, "manifest.json");

  if (existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
      return { js: `/assets/${manifest.js}`, css: `/assets/${manifest.css}` };
    } catch {}
  }

  if (existsSync(assetsDir)) {
    const files = readdirSync(assetsDir);
    const jsFile = files.find(
      (f) => f.startsWith("main-") && f.endsWith(".js"),
    );
    const cssFile = files.find(
      (f) => f.startsWith("main-") && f.endsWith(".css"),
    );
    return {
      js: jsFile ? `/assets/${jsFile}` : "/assets/main.js",
      css: cssFile ? `/assets/${cssFile}` : "/assets/main.css",
    };
  }

  return { js: "/assets/main.js", css: "/assets/main.css" };
}

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
    data.posts = getAllPublishedPosts(db);
  } else if (url.startsWith("/post/")) {
    const slugPart = url.split("/post/")[1];
    if (slugPart) {
      const slug = decodeURIComponent(slugPart);
      const post = getPostBySlug(db, slug);
      if (post) {
        data.post = post;
      }
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

  const assets = getAssetManifest();

  const cookieHeader = req.headers.get("cookie") || "";
  const themeCookie = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith("theme="));
  const themeValueRaw = themeCookie
    ? themeCookie.split("=")[1]?.trim()
    : "light";
  const themeValue = themeValueRaw || "light";
  const isDark = themeValue === "dark";

  const htmlClass = isDark ? ' class="dark"' : "";

  const html = `<!DOCTYPE html>
<html lang="zh-CN"${htmlClass}>
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
      window.__SSR_DATA__ = ${JSON.stringify(ssrData)};
    </script>
    <link rel="stylesheet" crossorigin href="${assets.css}">
  </head>
  <body class="min-h-screen bg-gray-50">
    <div id="root">${appHtml}</div>
    <script type="module" crossorigin src="${assets.js}"></script>
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