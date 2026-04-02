import React from "react";
import { renderToString } from "react-dom/server";
import App from "../../frontend/src/App";

const template = `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>博客</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"><!--ssr-outlet--></div>
    <script type="module" src="/frontend/src/entry-client.tsx"></script>
  </body>
</html>`;

export async function renderSSR(req: Request) {
  const appHtml = renderToString(<App />);
  const html = template.replace("<!--ssr-outlet-->", appHtml);

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}
