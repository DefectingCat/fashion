import MDEditor from '@uiw/react-md-editor'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Post, Tag } from '../../../src/types'
import { PasteImageUpload } from '../components/PasteImageUpload'
import TagSelector from '../components/TagSelector'
import { useAuth } from '../contexts/AuthContext'

export default function PostEditor() {
  const { id } = useParams<{ id?: string }>()
  const { token, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    cover_image: '',
    published: true,
  })
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch('/api/posts')
      const posts: (Post & { tags?: Tag[] })[] = await res.json()
      const post = posts.find((p) => p.id === Number(id))
      if (post) {
        setForm({
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt || '',
          cover_image: post.cover_image || '',
          published: post.published === 1,
        })
        if (post.tags) {
          setSelectedTagIds(post.tags.map((t) => t.id))
        }
      } else {
        navigate('/admin')
      }
    } catch (err) {
      console.error('Failed to fetch post:', err)
    } finally {
      setFetching(false)
    }
  }, [id, navigate])

  useEffect(() => {
    if (isEdit && !authLoading) {
      fetchPost()
    }
  }, [isEdit, authLoading, fetchPost])

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!res.ok) {
        throw new Error('上传失败')
      }

      const data = await res.json()
      setForm((f) => ({ ...f, cover_image: data.url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = isEdit ? `/api/posts/${id}` : '/api/posts'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          published: form.published,
          tagIds: selectedTagIds,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || '保存失败')
      }

      navigate('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || fetching) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
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
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            {isEdit ? '编辑文章' : '新建文章'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              标题
            </label>
            <input
              id="title"
              type="text"
              required
              value={form.title}
              onChange={(e) => {
                const title = e.target.value
                setForm((f) => ({
                  ...f,
                  title,
                  slug: f.slug || generateSlug(title),
                }))
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="输入文章标题"
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
              别名 (Slug)
            </label>
            <input
              id="slug"
              type="text"
              required
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="文章URL别名"
            />
          </div>

          <div>
            <label htmlFor="cover_image" className="block text-sm font-medium text-gray-700 mb-2">
              封面图片
            </label>
            {form.cover_image && (
              <div className="mb-3">
                <img
                  src={form.cover_image}
                  alt="封面预览"
                  className="max-h-48 rounded-lg object-cover"
                />
              </div>
            )}
            <div className="flex gap-3">
              <input
                type="url"
                value={form.cover_image}
                onChange={(e) => setForm((f) => ({ ...f, cover_image: e.target.value }))}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium">
                {uploading ? '上传中...' : '上传图片'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
              摘要
            </label>
            <textarea
              id="excerpt"
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="文章简短描述"
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">标签</span>
            <TagSelector
              selectedTagIds={selectedTagIds}
              onChange={setSelectedTagIds}
              disabled={loading}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="block text-sm font-medium text-gray-700">内容 (Markdown)</span>
              {imageUploading && (
                <span className="text-sm text-blue-600 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  正在上传图片...
                </span>
              )}
            </div>
            <div data-color-mode="light">
              <PasteImageUpload
                token={token}
                onUploadStart={() => setImageUploading(true)}
                onUploadEnd={() => setImageUploading(false)}
                onError={(err) => {
                  setError(err)
                  setImageUploading(false)
                }}
              >
                <MDEditor
                  value={form.content}
                  onChange={(val) => setForm((f) => ({ ...f, content: val ?? '' }))}
                  height={500}
                />
              </PasteImageUpload>
            </div>
            <p className="mt-2 text-sm text-gray-500">💡 提示：直接粘贴图片即可自动上传</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="published"
              checked={form.published}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="published" className="text-sm font-medium text-gray-700">
              立即发布
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? '保存中...' : '保存'}
            </button>
            <Link
              to="/admin"
              className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 font-medium"
            >
              取消
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
