/**
 * @file 标签管理页面
 * @description 管理所有标签，支持创建、编辑、删除标签
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { Tag } from '../../../src/types'

const DEFAULT_COLORS = [
  '#61dafb',
  '#3178c6',
  '#fbf0df',
  '#ff69b4',
  '#00d8ff',
  '#9acd32',
  '#ff6b6b',
  '#4ecdc4',
  '#45b7d1',
  '#96ceb4',
  '#ffeaa7',
  '#dfe6e9',
]

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

export default function TagManager() {
  const { user, token, loading: authLoading } = useAuth()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [tagName, setTagName] = useState('')
  const [tagColor, setTagColor] = useState(DEFAULT_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/tags')
      const data = await res.json()
      setTags(data.tags || [])
    } catch (err) {
      console.error('Failed to fetch tags:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tagName.trim() || !token) return

    setSaving(true)
    setError(null)

    try {
      const url = editingTag ? `/api/tags/${editingTag.id}` : '/api/tags'
      const method = editingTag ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: tagName.trim(), color: tagColor }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || '保存失败')
      }

      await fetchTags()
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (tagId: number) => {
    if (!token || !confirm('确定要删除这个标签吗？')) return

    try {
      const res = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || '删除失败')
      }

      await fetchTags()
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    }
  }

  const startEdit = (tag: Tag) => {
    setEditingTag(tag)
    setTagName(tag.name)
    setTagColor(tag.color || DEFAULT_COLORS[0])
    setShowForm(true)
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingTag(null)
    setTagName('')
    setTagColor(DEFAULT_COLORS[0])
    setError(null)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">请先登录</p>
          <Link to="/auth/login" className="text-blue-600 hover:text-blue-800">
            前往登录
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/admin" className="text-blue-600 hover:text-blue-800">
            ← 返回管理后台
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">标签管理</h1>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-600">共 {tags.length} 个标签</p>
            <button
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + 新建标签
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4"
            >
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    标签名称
                  </label>
                  <input
                    type="text"
                    value={tagName}
                    onChange={(e) => setTagName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="输入标签名称"
                    autoFocus
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    颜色
                  </label>
                  <div className="flex gap-1 flex-wrap">
                    {DEFAULT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setTagColor(color)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          tagColor === color
                            ? 'border-gray-800 ring-2 ring-offset-1'
                            : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving || !tagName.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? '保存中...' : editingTag ? '更新' : '创建'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: tag.color || '#e5e7eb',
                      color: tag.color ? getContrastColor(tag.color) : '#374151',
                    }}
                  >
                    {tag.name}
                  </span>
                  <span className="text-sm text-gray-500">
                    {tag.post_count || 0} 篇文章
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(tag)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(tag.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}

            {tags.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                暂无标签
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
