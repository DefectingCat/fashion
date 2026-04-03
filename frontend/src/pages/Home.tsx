/**
 * @file 博客首页
 * @description 展示所有已发布的文章列表，包含标签展示
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import { Link } from 'react-router-dom'
import type { Post, Tag } from '../../../src/types'
import LoadingSpinner from '../components/LoadingSpinner'
import { useSSRData } from '../hooks/useSSRData'
import { Routes } from '../routes'
import { getContrastColor } from '../utils/colors'

export default function Home() {
  const { data: posts, loading } = useSSRData<(Post & { tags?: Tag[] })[]>('posts', async () => {
    const res = await fetch('/api/posts')
    return res.json()
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <LoadingSpinner size="lg" className="py-12" />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts?.map((post) => (
              <Link
                key={post.id}
                to={Routes.Post(post.slug)}
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

                  {/* 标签展示 */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <Link
                          key={tag.id}
                          to={Routes.Tag(tag.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-1 rounded-full text-xs font-medium hover:opacity-80 transition-opacity"
                          style={{
                            backgroundColor: tag.color || '#e5e7eb',
                            color: tag.color ? getContrastColor(tag.color) : '#374151',
                          }}
                        >
                          {tag.name}
                        </Link>
                      ))}
                    </div>
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
        )}
        {!loading && (!posts || posts.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无文章</p>
          </div>
        )}
      </main>
    </div>
  )
}
