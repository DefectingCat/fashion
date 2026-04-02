import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "../../frontend/src/App";
import template from "./template.html";

export async function renderSSR(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname;

  const appHtml = renderToString(
    <StaticRouter location={path}>
      <App />
    </StaticRouter>
  );

  const html = template.replace("<!--ssr-outlet-->", appHtml);

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}
