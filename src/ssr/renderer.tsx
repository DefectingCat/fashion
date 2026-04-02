import React from "react";
import { renderToString } from "react-dom/server";
import App from "../../frontend/src/App";
import template from "./template.html";

export async function renderSSR(req: Request) {
  const appHtml = renderToString(<App />);
  const html = template.replace("<!--ssr-outlet-->", appHtml);

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}
,