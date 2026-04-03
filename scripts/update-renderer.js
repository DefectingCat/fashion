#!/usr/bin/env node
/**
 * @file 构建后自动更新 renderer.tsx 中的资源引用
 * @description 读取 vite manifest.json，替换 renderer.tsx 中的资源文件名
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function updateRenderer() {
  const manifestPath = resolve(__dirname, '../dist/client/.vite/manifest.json')

  if (!existsSync(manifestPath)) {
    console.log('⚠️  manifest.json not found, skipping...')
    return
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
  const rendererPath = resolve(__dirname, '../src/ssr/renderer.tsx')

  let content = readFileSync(rendererPath, 'utf-8')

  // 找到 index.html 对应的资源
  const indexEntry = manifest['index.html']
  if (!indexEntry) {
    console.log('⚠️  index.html entry not found in manifest')
    return
  }

  // 更新 JS 文件引用
  const jsFile = indexEntry.js?.[0]
  if (jsFile) {
    const oldJsPattern = /src="\/assets\/main-[^"]+\.js"/
    const newJsSrc = `src="/assets/${jsFile}"`
    content = content.replace(oldJsPattern, `src="${newJsSrc}"`)
    console.log(`✅ Updated JS: ${jsFile}`)
  }

  // 更新 CSS 文件引用
  const cssFile = indexEntry.css?.[0]
  if (cssFile) {
    const oldCssPattern = /href="\/assets\/main-[^"]+\.css"/
    const newCssHref = `href="/assets/${cssFile}"`
    content = content.replace(oldCssPattern, `href="${newCssHref}"`)
    console.log(`✅ Updated CSS: ${cssFile}`)
  }

  writeFileSync(rendererPath, content, 'utf-8')
  console.log('✅ renderer.tsx updated successfully!')
}

updateRenderer()
