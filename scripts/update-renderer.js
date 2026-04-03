#!/usr/bin/env node
/**
 * @file 构建后自动更新 renderer.tsx 中的资源引用
 * @description 读取 dist/client/assets 目录，替换 renderer.tsx 中的资源文件名
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function updateRenderer() {
  const assetsDir = resolve(__dirname, "../dist/client/assets");

  if (!existsSync(assetsDir)) {
    console.log("⚠️  dist/client/assets not found, skipping...");
    return;
  }

  const files = readdirSync(assetsDir);
  const jsFile = files.find((f) => f.startsWith("main-") && f.endsWith(".js"));
  const cssFile = files.find((f) => f.startsWith("main-") && f.endsWith(".css"));

  if (!jsFile || !cssFile) {
    console.log("⚠️  main.js or main.css not found");
    return;
  }

  const manifest = { js: jsFile, css: cssFile };
  const manifestPath = resolve(assetsDir, "manifest.json");
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`✅ Generated manifest.json: ${JSON.stringify(manifest)}`);
  console.log("✅ Build resources update completed!");
}

updateRenderer();
