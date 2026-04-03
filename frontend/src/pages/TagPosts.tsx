/**
 * @file 标签文章列表页
 * @description 展示指定标签下的所有文章
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Post, Tag } from '../../../src/types'

/**
 * 根据背景色计算对比色（用于文字）
 *
 * @param hexColor - 十六进制颜色
 * @returns 黑色或白色
 */
function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#1f2937' : '#ffffff'
}

export default function TagPosts() {
  const { id } = useParams<{ id: string }>()
  const [tag, setTag] = useState<Tag | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!id) return

      try {
        const [tagRes, postsRes] = await Promise.all([
          fetch(`/api/tags/${id}`),
          fetch(`/api/tags/${id}/posts`),
        ])

        if (tagRes.ok && postsRes.ok) {
          const tagData = await tagRes.json()
          const postsData = await postsRes.json()
          setTag(tagData.tag)
          setPosts(postsData.posts || [])
        } else {
          setError('标签不存在')
        }
      } catch (err) {
        console.error('Failed to fetch tag data:', err)
        setError('加载失败')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !tag) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Link to="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← 返回首页
          </Link>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900">标签不存在</h1>
            <p className="mt-2 text-gray-600">{error}</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← 返回首页
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <span
              className="px-4 py-2 rounded-full text-lg font-medium"
              style={{
                backgroundColor: tag.color || '#e5e7eb',
                color: tag.color ? getContrastColor(tag.color) : '#374151',
              }}
            >
              {tag.name}
            </span>
            <span className="text-gray-500">{posts.length} 篇文章</span>
          </div>
        </div>

        {posts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/post/${post.slug}`}
                className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {post.cover_image && (
                  <div className="h-48 bg-gray-200 overflow-hidden">
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-2 text-gray-600 line-clamp-2">{post.excerpt}</p>
                  )}
                  <div className="mt-4 flex items-center text-sm text-gray-500">
                    <time dateTime={post.created_at}>
                      {new Date(post.created_at).toLocaleDateString('zh-CN')}
                    </time>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <p className="text-gray-500">暂无相关文章</p>
          </div>
        )}
      </main>
    </div>
  )
}
