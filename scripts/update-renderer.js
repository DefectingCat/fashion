#!/usr/bin/env node
/**
 * @file 构建后自动更新 renderer.tsx 中的资源引用
 * @description 读取 dist/client/assets 目录，替换 renderer.tsx 中的资源文件名
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function updateRenderer() {
  const assetsDir = resolve(__dirname, '../dist/client/assets')

  if (!existsSync(assetsDir)) {
    console.log('⚠️  dist/client/assets not found, skipping...')
    return
  }

  // 找到 main.js 和 main.css 文件
  const files = readdirSync(assetsDir)
  const jsFile = files.find((f) => f.startsWith('main-') && f.endsWith('.js'))
  const cssFile = files.find((f) => f.startsWith('main-') && f.endsWith('.css'))

  if (!jsFile || !cssFile) {
    console.log('⚠️  main.js or main.css not found')
    return
  }

  const rendererPath = resolve(__dirname, '../src/ssr/renderer.tsx')
  let content = readFileSync(rendererPath, 'utf-8')

  // 更新 JS 文件引用
  content = content.replace(/src="\/assets\/main-[^"]+\.js"/, `src="/assets/${jsFile}"`)
  console.log(`✅ Updated JS: ${jsFile}`)

  // 更新 CSS 文件引用
  content = content.replace(/href="\/assets\/main-[^"]+\.css"/, `href="/assets/${cssFile}"`)
  console.log(`✅ Updated CSS: ${cssFile}`)

  writeFileSync(rendererPath, content, 'utf-8')
  console.log('✅ renderer.tsx updated successfully!')
}

updateRenderer()
