/**
 * @file 客户端水合入口
 * @description React 客户端水合入口文件，用于激活 SSR 渲染的 HTML
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import { hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/global.css'

/** 获取根 DOM 元素 */
const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

/** 水合 SSR 渲染的 HTML 并挂载 React 应用 */
hydrateRoot(
  rootElement,
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)