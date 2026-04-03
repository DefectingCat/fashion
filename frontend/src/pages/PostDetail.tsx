/**
 * @file 文章详情页
 * @description 展示单篇文章的完整内容，包含标签展示
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import MDEditor from '@uiw/react-md-editor'
import { Link, useParams } from 'react-router-dom'
import type { Post, Tag } from '../../../src/types'
import LoadingSpinner from '../components/LoadingSpinner'
import CommentList from '../components/CommentList'
import { useSSRData } from '../hooks/useSSRData'
import { Routes } from '../routes'
import { getContrastColor } from '../utils/colors'

export default function PostDetail() {
  const { slug } = useParams<{ slug: string }>()

  const { data: post, loading } = useSSRData<(Post & { tags?: Tag[] }) | null>(
    'post',
    async () => {
      if (!slug) return null;
      const res = await fetch(`/api/posts/${encodeURIComponent(slug)}`);
      if (!res.ok) return null;
      return res.json();
    },
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Link to={Routes.Home} className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
              ← 返回首页
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">404</h1>
            <p className="mt-2 text-gray-600">文章不存在</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to={Routes.Home} className="text-blue-600 hover:text-blue-800">
            ← 返回首页
          </Link>
        </div>
        <article className="bg-white rounded-xl shadow-md overflow-hidden">
          {post.cover_image && (
            <div className="h-64 bg-gray-200">
              <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <time dateTime={post.created_at}>
                {new Date(post.created_at).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>

            {/* 标签展示 */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    to={Routes.Tag(tag.id)}
                    className="px-3 py-1 rounded-full text-sm font-medium hover:opacity-80 transition-opacity"
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

            {post.excerpt && <p className="mt-6 text-lg text-gray-600 italic">{post.excerpt}</p>}
            <div className="mt-8 prose prose-lg max-w-none">
              <div className="text-gray-700 leading-relaxed">
                <MDEditor.Markdown source={post.content} />
              </div>
            </div>
          </div>
        </article>
        <CommentList postId={post.id} />
      </main>
    </div>
  )
}
