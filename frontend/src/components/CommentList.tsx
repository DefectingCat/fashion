import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import type { Comment, User } from '../../../src/types'
import { useAuth } from '../contexts/AuthContext'

interface CommentWithAuthor extends Comment {
  author?: User
}

interface CommentListProps {
  postId: number
}

export default function CommentList({ postId }: CommentListProps) {
  const { user, token } = useAuth()
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`)
      if (res.ok) {
        setComments(await res.json())
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err)
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !token) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment }),
      })
      if (res.ok) {
        setNewComment('')
        fetchComments()
      }
    } catch (err) {
      console.error('Failed to post comment:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: number) => {
    if (!confirm('确定要删除这条评论吗？') || !token) return

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        fetchComments()
      }
    } catch (err) {
      console.error('Failed to delete comment:', err)
    }
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
