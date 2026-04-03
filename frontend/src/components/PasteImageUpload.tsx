import React from 'react'

interface PasteImageUploadProps {
  token: string | null
  onUploadStart?: () => void
  onUploadEnd?: () => void
  onError?: (error: string) => void
  children: React.ReactElement
}

export function PasteImageUpload({ 
  token, 
  onUploadStart, 
  onUploadEnd, 
  onError, 
  children 
}: PasteImageUploadProps) {
  const handlePaste = async (event: React.ClipboardEvent) => {
    const clipboardData = event.clipboardData
    if (!clipboardData || clipboardData.files.length === 0) {
      return
    }

    const file = clipboardData.files[0]
    if (!file.type.startsWith('image/')) {
      return
    }

    event.preventDefault()
    onUploadStart?.()

    try {
      const formData = new FormData()
      formData.append('file', file)

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
      const imageMarkdown = `![${file.name}](${data.url})\n`

      document.execCommand('insertText', false, imageMarkdown)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '图片上传失败'
      onError?.(errorMsg)
    } finally {
      onUploadEnd?.()
    }
  }

  const childWithProps = React.cloneElement(children, {
    onPaste: handlePaste,
  })

  return childWithProps
}