/**
 * @file 服务端渲染入口
 * @description React 服务端渲染入口文件，用于在 Node.js 环境中渲染 React 应用
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import App from './App'
import { type SSRData, setSSRData } from './ssrData'

/**
 * 渲染结果
 */
interface RenderResult {
  /** 渲染后的 HTML 字符串 */
  html: string
  /** 渲染时获取的数据 */
  data: SSRData
}

/**
 * 服务端渲染函数
 *
 * @param url - 请求的 URL 路径
 * @param fetchData - 获取数据的函数
 * @returns 渲染结果，包含 HTML 和数据
 */
export async function render(
  url: string,
  fetchData: (url: string) => Promise<SSRData>,
): Promise<RenderResult> {
  const data = await fetchData(url)
  setSSRData(data)

  const html = renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>,
  )

  return { html, data }
}