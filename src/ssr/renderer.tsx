import React from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import App from '../../frontend/src/App'
import db from '../db'
import type { Post, SSRData } from '../types'
import { setSSRData } from '../../frontend/src/ssrData'

async function fetchSSRData(url: string): Promise<SSRData> {
  const data: SSRData = {}

  if (url === '/' || url === '') {
    const stmt = db.prepare('SELECT * FROM posts WHERE published = 1 ORDER BY created_at DESC')
    data.posts = stmt.all() as Post[]
  } else if (url.startsWith('/post/')) {
    const slug = url.split('/post/')[1]
    const stmt = db.prepare('SELECT * FROM posts WHERE slug = ?')
    data.post = (stmt.get(slug as string) as Post) || null;
  }

  return data
}

export async function renderSSR(req: Request) {
  const url = new URL(req.url)
  const path = url.pathname

  const ssrData = await fetchSSRData(path)
  setSSRData(ssrData)

  const appHtml = renderToString(
    <StaticRouter location={path}>
      <App />
    </StaticRouter>
  )

  let title = '我的博客'
  let description = '分享技术，记录成长'
  let ogImage = ''

  if (ssrData.post) {
    title = `${ssrData.post.title} - 我的博客`
    description = ssrData.post.excerpt || description
    ogImage = ssrData.post.cover_image || ''
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
    
    <script src="https://cdn.tailwindcss.com"></script>

    <script>
      window.__SSR_DATA__ = ${JSON.stringify(ssrData)};
    </script>
  </head>
  <body class="bg-gray-50 min-h-screen">
    <div id="root">${appHtml}</div>
    <script type="module" crossorigin src="/assets/main-DNRXaeIA.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/main-QNqYXfMF.css">
  </body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  })
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (m) => map[m] || m);
}
