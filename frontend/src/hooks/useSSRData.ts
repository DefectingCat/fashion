import { useState, useEffect, useMemo } from 'react'
import { getSSRData, isSSR, type SSRData } from '../ssrData'

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
    if (isSSR() || hasSSRData) {
      return false
    }
    return true
  })

  useEffect(() => {
    if (!hasSSRData && !isSSR()) {
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
