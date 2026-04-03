/**
 * @file 标签选择组件
 * @description 提供标签多选功能，支持创建新标签
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import React, { useState, useEffect } from 'react'
import type { Tag } from '../../../src/types'

interface TagSelectorProps {
  /** 已选中的标签 ID 列表 */
  selectedTagIds: number[]
  /** 标签变化回调 */
  onChange: (tagIds: number[]) => void
  /** 是否禁用 */
  disabled?: boolean
}

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

export default function TagSelector({
  selectedTagIds,
  onChange,
  disabled = false,
}: TagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewTagForm, setShowNewTagForm] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(DEFAULT_COLORS[0])
  const [creating, setCreating] = useState(false)

  // 加载所有可用标签
  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/tags')
      const data = await res.json()
      setAvailableTags(data.tags || [])
    } catch (err) {
      console.error('Failed to fetch tags:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tagId: number) => {
    if (disabled) return
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId))
    } else {
      onChange([...selectedTagIds, tagId])
    }
  }

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTagName.trim()) return

    setCreating(true)
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setAvailableTags([...availableTags, data.tag])
        onChange([...selectedTagIds, data.tag.id])
        setNewTagName('')
        setShowNewTagForm(false)
      }
    } catch (err) {
      console.error('Failed to create tag:', err)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-gray-200 rounded w-20"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id)
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              disabled={disabled}
              className={`
                px-3 py-1 rounded-full text-sm font-medium transition-all
                ${isSelected ? 'ring-2 ring-offset-2' : 'opacity-70 hover:opacity-100'}
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
              style={{
                backgroundColor: tag.color || '#e5e7eb',
                color: tag.color ? getContrastColor(tag.color) : '#374151',
                outlineColor: tag.color || '#3b82f6',
              }}
            >
              {tag.name}
              {tag.post_count !== undefined && (
                <span className="ml-1 opacity-70">({tag.post_count})</span>
              )}
            </button>
          )
        })}

        {!disabled && (
          <button
            type="button"
            onClick={() => setShowNewTagForm(!showNewTagForm)}
            className="px-3 py-1 rounded-full text-sm font-medium border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
          >
            + 新建标签
          </button>
        )}
      </div>

      {showNewTagForm && (
        <form onSubmit={handleCreateTag} className="flex gap-2 items-start">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="标签名称"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <div className="flex gap-1">
            {DEFAULT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewTagColor(color)}
                className={`w-8 h-8 rounded-full border-2 ${
                  newTagColor === color ? 'border-gray-800 ring-2 ring-offset-1' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={creating || !newTagName.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? '创建中...' : '创建'}
          </button>
          <button
            type="button"
            onClick={() => setShowNewTagForm(false)}
            className="text-gray-500 hover:text-gray-700 px-3 py-2"
          >
            取消
          </button>
        </form>
      )}
    </div>
  )
}

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
