/**
 * @file SSR 数据管理
 * @description 管理服务端渲染（SSR）时传递的数据，支持客户端水合
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import type { Post } from '../../src/types'

/**
 * SSR 数据结构
 */
export interface SSRData {
  /** 文章列表数据 */
  posts?: Post[]
  /** 单篇文章数据 */
  post?: Post | null
  /** 扩展字段 */
  [key: string]: unknown
}

/** 内存中的 SSR 数据存储 */
let __SSR_DATA__: SSRData = {}

/**
 * 设置 SSR 数据
 *
 * 在服务端渲染时调用，将数据存入内存
 *
 * @param data - SSR 数据对象
 */
export function setSSRData(data: SSRData) {
  __SSR_DATA__ = data
}

/**
 * 获取 SSR 数据
 *
 * 优先从 window 对象读取（客户端水合），否则从内存获取
 *
 * @returns SSR 数据对象
 */
export function getSSRData(): SSRData {
  if (typeof window !== 'undefined' && '__SSR_DATA__' in window) {
    const ssrWindow = window as Window & { __SSR_DATA__?: SSRData }
    return ssrWindow.__SSR_DATA__ || __SSR_DATA__
  }
  return __SSR_DATA__
}

/**
 * 清除 SSR 数据
 *
 * 用于客户端路由切换时重置数据
 */
export function clearSSRData() {
  __SSR_DATA__ = {}
}

/**
 * 判断当前是否在服务端环境
 *
 * @returns 是否为服务端环境
 */
export function isSSR(): boolean {
  return typeof window === 'undefined'
}