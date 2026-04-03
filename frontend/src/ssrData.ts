import type { Post } from '../../src/types'

export interface SSRData {
  posts?: Post[]
  post?: Post | null
  [key: string]: unknown
}

let __SSR_DATA__: SSRData = {}

export function setSSRData(data: SSRData) {
  __SSR_DATA__ = data
}

export function getSSRData(): SSRData {
  if (typeof window !== 'undefined' && '__SSR_DATA__' in window) {
    const ssrWindow = window as Window & { __SSR_DATA__?: SSRData }
    return ssrWindow.__SSR_DATA__ || __SSR_DATA__
  }
  return __SSR_DATA__
}

export function clearSSRData() {
  __SSR_DATA__ = {}
}

export function isSSR(): boolean {
  return typeof window === 'undefined'
}
