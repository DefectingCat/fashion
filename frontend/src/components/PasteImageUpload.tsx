/**
 * @file 图片粘贴上传组件
 * @description 拦截编辑器的粘贴事件，自动检测剪贴板中的图片并上传至服务器
 * @author Fashion Blog Team
 * @created 2024-02-10
 */

import React from 'react'

/**
 * 图片粘贴上传组件属性
 */
interface PasteImageUploadProps {
  /** JWT 认证 token，用于上传接口认证 */
  token: string | null
  /** 上传开始回调 */
  onUploadStart?: () => void
  /** 上传结束回调（无论成功或失败） */
  onUploadEnd?: () => void
  /** 上传错误回调，传入错误信息 */
  onError?: (error: string) => void
  /** 子组件，通常是 MDEditor */
  children: React.ReactElement
}

/**
 * 图片粘贴上传高阶组件
 *
 * 包裹 Markdown 编辑器，拦截粘贴事件，自动上传剪贴板中的图片
 *
 * @param props - 组件属性
 * @param props.token - JWT 认证 token
 * @param props.onUploadStart - 上传开始回调
 * @param props.onUploadEnd - 上传结束回调
 * @param props.onError - 上传错误回调
 * @param props.children - 子组件（MDEditor）
 * @returns 包装后的编辑器组件
 * @example
 * ```tsx
 * <PasteImageUpload token={token}>
 *   <MDEditor value={content} onChange={setContent} />
 * </PasteImageUpload>
 * ```
 */
export function PasteImageUpload({ 
  token, 
  onUploadStart, 
  onUploadEnd, 
  onError, 
  children 
}: PasteImageUploadProps) {
  /**
   * 处理粘贴事件
   *
   * 检测剪贴板中的图片文件，自动上传并插入 Markdown 语法
   *
   * @param event - 剪贴板事件
   */
  const handlePaste = async (event: React.ClipboardEvent) => {
    const clipboardData = event.clipboardData

    // 检查剪贴板中是否有文件
    if (!clipboardData || clipboardData.files.length === 0) {
      return
    }

    const file = clipboardData.files[0]

    // 只处理图片文件
    if (!file.type.startsWith('image/')) {
      return
    }

    // 阻止默认粘贴行为
    event.preventDefault()
    onUploadStart?.()

    try {
      // 构建上传表单数据
      const formData = new FormData()
      formData.append('file', file)

      // 调用上传接口
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!res.ok) {
        throw new Error('图片上传失败')
      }

      const data = await res.json()
      // 生成 Markdown 图片语法
      const imageMarkdown = `![${file.name}](${data.url})\n`

      // HACK: 使用 execCommand 插入文本
      // 该 API 已过时，但目前是最兼容的方式
      // 后续应考虑使用 MDEditor 的 API
      document.execCommand('insertText', false, imageMarkdown)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '图片上传失败'
      onError?.(errorMsg)
    } finally {
      onUploadEnd?.()
    }
  }

  // 克隆子组件并添加 onPaste 事件
  const childWithProps = React.cloneElement(children, {
    onPaste: handlePaste,
  })

  return childWithProps
}
