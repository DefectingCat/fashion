import type { Post } from '../../src/types'

export interface SSRData {
  posts?: Post[]
  post?: Post
  [key: string]: unknown
}

let __SSR_DATA__: SSRData = {}

export function setSSRData(data: SSRData) {
  __SSR_DATA__ = data
}

export function getSSRData(): SSRData {
  if (typeof window !== 'undefined' && (window as any).__SSR_DATA__) {
    return (window as any).__SSR_DATA__
  }
  return __SSR_DATA__
}

export function clearSSRData() {
  __SSR_DATA__ = {}
}

export function isSSR(): boolean {
  return typeof window === 'undefined'
}
