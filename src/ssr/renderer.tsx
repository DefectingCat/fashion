import db from "../db";
import type { Post } from "../types";

export async function renderSSR(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname;

  let posts: Post[] = [];
  try {
    const stmt = db.prepare("SELECT * FROM posts WHERE published = 1 ORDER BY created_at DESC");
    posts = stmt.all() as Post[];
  } catch (e) {
    console.error("Failed to fetch posts:", e);
  }

  let currentPost: Post | null = null;
  if (path.startsWith("/post/")) {
    const slug = path.split("/post/")[1];
    currentPost = posts.find((p) => p.slug === slug) || null;
  }

  let html = "";

  if (path === "/" || path === "") {
    html = renderHomePage(posts);
  } else if (path.startsWith("/post/") && currentPost) {
    html = renderPostPage(currentPost);
  } else if (path === "/auth/login") {
    html = renderLoginPage();
  } else if (path === "/auth/register") {
    html = renderRegisterPage();
  } else {
    html = renderHomePage(posts);
  }

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}

function renderHomePage(posts: Post[]) {
  const postsHtml = posts.length > 0
    ? `<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        ${posts.map((post) => `
          <a href="/post/${post.slug}" class="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            ${post.cover_image ? `
              <div class="h-48 bg-gray-200 overflow-hidden">
                <img src="${post.cover_image}" alt="${escapeHtml(post.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
              </div>
            ` : ''}
            <div class="p-6">
              <h2 class="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">${escapeHtml(post.title)}</h2>
              ${post.excerpt ? `<p class="mt-2 text-gray-600 line-clamp-2">${escapeHtml(post.excerpt)}</p>` : ''}
              <div class="mt-4 flex items-center text-sm text-gray-500">
                <time datetime="${post.created_at}">${new Date(post.created_at).toLocaleDateString("zh-CN")}</time>
              </div>
            </div>
          </a>
        `).join('')}
      </div>`
    : `<div class="text-center py-12">
        <p class="text-gray-500">暂无文章</p>
      </div>`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>我的博客</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-gray-50 min-h-screen">
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold text-gray-900">我的博客</h1>
        <p class="mt-1 text-sm text-gray-600">分享技术，记录成长</p>
      </div>
    </header>
    <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      ${postsHtml}
    </main>
  </body>
</html>`;
}

function renderPostPage(post: Post) {
  const escapedContent = post.content.replace(/`/g, '\\`').replace(/\$/g, '\\$');
  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(post.title)} - 我的博客</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  </head>
  <body class="bg-gray-50 min-h-screen">
    <header class="bg-white shadow-sm">
      <div class="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <a href="/" class="text-blue-600 hover:text-blue-800">← 返回首页</a>
      </div>
    </header>
    <main class="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <article class="bg-white rounded-xl shadow-md overflow-hidden">
        ${post.cover_image ? `
          <div class="h-64 bg-gray-200">
            <img src="${post.cover_image}" alt="${escapeHtml(post.title)}" class="w-full h-full object-cover">
          </div>
        ` : ''}
        <div class="p-8">
          <h1 class="text-3xl font-bold text-gray-900">${escapeHtml(post.title)}</h1>
          <div class="mt-4 flex items-center text-sm text-gray-500">
            <time datetime="${post.created_at}">${new Date(post.created_at).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}</time>
          </div>
          ${post.excerpt ? `<p class="mt-6 text-lg text-gray-600 italic">${escapeHtml(post.excerpt)}</p>` : ''}
          <div id="content" class="mt-8 prose prose-lg max-w-none text-gray-700 leading-relaxed"></div>
        </div>
      </article>
    </main>
    <script>
      document.getElementById('content').innerHTML = marked.parse(\`${escapedContent}\`);
    </script>
  </body>
</html>`;
}

function renderLoginPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>登录 - 我的博客</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-gray-50 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">登录</h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          还没有账号？ <a href="/auth/register" class="font-medium text-blue-600 hover:text-blue-500">立即注册</a>
        </p>
      </div>
      <form class="mt-8 space-y-6" id="loginForm">
        <div id="error" class="hidden bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"></div>
        <div class="space-y-4">
          <div>
            <label for="email" class="sr-only">邮箱</label>
            <input id="email" name="email" type="email" required class="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="邮箱地址">
          </div>
          <div>
            <label for="password" class="sr-only">密码</label>
            <input id="password" name="password" type="password" required class="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="密码">
          </div>
        </div>
        <div>
          <button type="submit" id="submitBtn" class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">登录</button>
        </div>
      </form>
    </div>
    <script>
      document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorDiv = document.getElementById('error');
        const submitBtn = document.getElementById('submitBtn');
        errorDiv.classList.add('hidden');
        
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        
        submitBtn.disabled = true;
        submitBtn.textContent = '登录中...';
        
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          
          const data = await res.json();
          
          if (!res.ok) {
            throw new Error(data.message || '登录失败');
          }
          
          window.location.href = '/';
        } catch (err) {
          errorDiv.textContent = err.message;
          errorDiv.classList.remove('hidden');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = '登录';
        }
      });
    </script>
  </body>
</html>`;
}

function renderRegisterPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>注册 - 我的博客</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-gray-50 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">注册</h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          已有账号？ <a href="/auth/login" class="font-medium text-blue-600 hover:text-blue-500">立即登录</a>
        </p>
      </div>
      <form class="mt-8 space-y-6" id="registerForm">
        <div id="error" class="hidden bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"></div>
        <div class="space-y-4">
          <div>
            <label for="username" class="sr-only">用户名</label>
            <input id="username" name="username" type="text" required class="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="用户名">
          </div>
          <div>
            <label for="email" class="sr-only">邮箱</label>
            <input id="email" name="email" type="email" required class="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="邮箱地址">
          </div>
          <div>
            <label for="password" class="sr-only">密码</label>
            <input id="password" name="password" type="password" required class="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="密码">
          </div>
        </div>
        <div>
          <button type="submit" id="submitBtn" class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">注册</button>
        </div>
      </form>
    </div>
    <script>
      document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorDiv = document.getElementById('error');
        const submitBtn = document.getElementById('submitBtn');
        errorDiv.classList.add('hidden');
        
        const formData = new FormData(e.target);
        const username = formData.get('username');
        const email = formData.get('email');
        const password = formData.get('password');
        
        submitBtn.disabled = true;
        submitBtn.textContent = '注册中...';
        
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
          });
          
          const data = await res.json();
          
          if (!res.ok) {
            throw new Error(data.message || '注册失败');
          }
          
          window.location.href = '/auth/login';
        } catch (err) {
          errorDiv.textContent = err.message;
          errorDiv.classList.remove('hidden');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = '注册';
        }
      });
    </script>
  </body>
</html>`;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
