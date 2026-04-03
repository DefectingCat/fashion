import React from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import App from './App'
import { setSSRData, type SSRData } from './ssrData'
import type { Post } from '../../src/types'

interface RenderResult {
  html: string
  data: SSRData
}

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
