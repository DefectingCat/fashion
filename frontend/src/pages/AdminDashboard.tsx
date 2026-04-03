/**
 * @file 管理后台首页
 * @description 展示文章列表和系统统计数据
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { Post } from '../../../src/types'

interface Stats {
  users: number
  posts: number
  publishedPosts: number
  draftPosts: number
  tags: number
  comments: number
}

export default function AdminDashboard() {
  const { user, token, loading } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/login')
    } else if (user) {
      fetchPosts()
      fetchStats()
    }
  }, [loading, user])

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts')
      const data = await res.json()
      setPosts(data)
    } catch (err) {
      console.error('Failed to fetch posts:', err)
    } finally {
      setPostsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats')
      const data = await res.json()
      setStats(data.stats)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const handleDelete = async (postId: number) => {
    if (!confirm('确定要删除这篇文章吗？')) return

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        setPosts(posts.filter((p) => p.id !== postId))
      }
    } catch (err) {
      console.error('Failed to delete post:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded w-1/6"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link to="/" className="text-blue-600 hover:text-blue-800">
              ← 返回首页
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">管理后台</h1>
          </div>
          <Link
            to="/admin/posts/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            + 新建文章
          </Link>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-3xl font-bold text-blue-600">{stats.posts}</div>
              <div className="text-gray-500 mt-1">文章总数</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-3xl font-bold text-green-600">{stats.publishedPosts}</div>
              <div className="text-gray-500 mt-1">已发布</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-3xl font-bold text-purple-600">{stats.tags}</div>
              <div className="text-gray-500 mt-1">
                <Link to="/admin/tags" className="hover:text-purple-600">
                  标签管理
                </Link>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-3xl font-bold text-orange-600">{stats.comments}</div>
              <div className="text-gray-500 mt-1">评论总数</div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">文章列表</h2>
          </div>

          {postsLoading ? (
            <div className="p-8">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">还没有文章</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="p-6 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <Link
                      to={`/post/${post.slug}`}
                      className="text-lg font-medium text-gray-900 hover:text-blue-600"
                    >
                      {post.title}
                    </Link>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{new Date(post.created_at).toLocaleDateString('zh-CN')}</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          post.published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {post.published ? '已发布' : '草稿'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/posts/${post.id}/edit`}
                      className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg hover:bg-blue-50"
                    >
                      编辑
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(post.id)}
                      className="text-red-600 hover:text-red-800 px-3 py-1 rounded-lg hover:bg-red-50"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
