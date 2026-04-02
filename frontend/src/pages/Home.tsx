import React from 'react'
import { Link } from 'react-router-dom'
import { useSSRData } from '../hooks/useSSRData'
import type { Post } from '../../../src/types'

export default function Home() {
  const { data: posts, loading } = useSSRData<Post[]>('posts', async () => {
    const res = await fetch('/api/posts')
    return res.json()
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">我的博客</h1>
          <p className="mt-1 text-sm text-gray-600">分享技术，记录成长</p>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts?.map((post) => (
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
                    <p className="mt-2 text-gray-600 line-clamp-2">
                      {post.excerpt}
                    </p>
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
