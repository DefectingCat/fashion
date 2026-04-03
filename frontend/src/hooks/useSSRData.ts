/**
 * @file SSR 数据 Hook
 * @description 用于在组件中获取 SSR 预取数据的自定义 Hook
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import { useEffect, useState } from 'react'
import { getSSRData } from '../ssrData'

/**
 * 使用 SSR 数据的 Hook
 *
 * 优先返回 SSR 预取的数据，如果不存在则执行 fetchFn 异步获取
 *
 * @param key - SSR 数据键名
 * @param fetchFn - 数据获取函数（当 SSR 数据不存在时调用）
 * @returns 包含 data 和 loading 状态的对象
 * @example
 * ```tsx
 * const { data: posts, loading } = useSSRData<Post[]>('posts', async () => {
 *   const res = await fetch('/api/posts')
 *   return res.json()
 * })
 * ```
 */
export function useSSRData<T>(
  key: string,
  fetchFn: () => Promise<T>,
): { data: T | null; loading: boolean } {
  const ssrData = getSSRData()
  const hasSSRData = ssrData[key] !== undefined

  const [data, setData] = useState<T | null>(() => {
    if (hasSSRData) {
      return ssrData[key] as T
    }
    return null
  })

  const [loading, setLoading] = useState(() => {
    if (hasSSRData) {
      return false
    }
    return true
  })

  useEffect(() => {
    if (!hasSSRData) {
      fetchFn()
        .then((fetchedData) => {
          setData(fetchedData)
          setLoading(false)
        })
        .catch((err) => {
          console.error(`Failed to fetch ${key}:`, err)
          setLoading(false)
        })
    }
  }, [key, fetchFn, hasSSRData])

  return { data, loading }
}