/**
 * @file 评论列表组件
 * @description 展示文章评论列表，支持评论发布和删除功能
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Comment, User } from '../../../src/types'
import { useAuth } from '../contexts/AuthContext'
import { useFormError } from '../hooks/useFormError'

/**
 * 包含作者信息的评论类型
 */
interface CommentWithAuthor extends Comment {
  /** 评论作者信息 */
  author?: User
}

/**
 * 评论列表组件属性
 */
interface CommentListProps {
  /** 文章 ID */
  postId: number
}

/**
 * 评论列表组件
 *
 * 展示指定文章的评论，支持登录用户发表评论和删除自己的评论
 *
 * @param props - 组件属性
 * @param props.postId - 文章 ID
 * @returns 评论列表组件
 */
export default function CommentList({ postId }: CommentListProps) {
  const { user, token } = useAuth()
  const { error, clearError, withErrorHandling } = useFormError()
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const savedCommentRef = useRef<string>('')

  /**
   * 获取评论列表
   */
  const fetchComments = useCallback(async () => {
    await withErrorHandling(async () => {
      const res = await fetch(`/api/posts/${postId}/comments`)
      if (res.ok) {
        setComments(await res.json())
      }
      setLoading(false)
      return null
    }, '获取评论失败')
  }, [postId, withErrorHandling])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  /**
   * 提交新评论
   *
   * @param event - 表单提交事件
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !token) return

    setSubmitting(true)
    clearError()

    await withErrorHandling(async () => {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment }),
      })
      if (res.ok) {
        savedCommentRef.current = newComment
        setNewComment('')
        fetchComments()
      }
      return null
    }, '发布评论失败')
    setSubmitting(false)
  }

  /**
   * 删除评论
   *
   * @param commentId - 要删除的评论 ID
   */
  const handleDelete = async (commentId: number) => {
    if (!confirm('确定要删除这条评论吗？') || !token) return

    await withErrorHandling(async () => {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        fetchComments()
      }
      return null
    }, '删除评论失败')
  }

  if (loading) {
    return (
      <div className="mt-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-12">
      <h3 className="text-xl font-bold text-gray-900 mb-6">评论 ({comments.length})</h3>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error.message}
        </div>
      )}

      {user && (
        <form onSubmit={handleSubmit} className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="写下你的评论..."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            required
          />
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? '发布中...' : '发布评论'}
            </button>
          </div>
        </form>
      )}

      {!user && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600">
            请先
            <a href="/auth/login" className="text-blue-600 hover:text-blue-800 mx-1">
              登录
            </a>
            后发表评论
          </p>
        </div>
      )}

      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无评论</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {comment.author?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {comment.author?.username || '匿名用户'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(comment.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
                {user && user.id === comment.author_id && (
                  <button
                    type="button"
                    onClick={() => handleDelete(comment.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    删除
                  </button>
                )}
              </div>
              <p className="mt-3 text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}