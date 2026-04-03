/**
 * @file 文件上传 API 路由
 * @description 处理图片文件上传，支持 JWT 认证
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import type { Database } from 'bun:sqlite'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { jwt } from '@elysiajs/jwt'
import { Elysia, t } from 'elysia'
import { requireJwtSecret } from '../utils/env'

const JWT_SECRET = requireJwtSecret()
/** 文件上传目录路径 */
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

/** 确保上传目录存在 */
if (!existsSync(UPLOAD_DIR)) {
  mkdir(UPLOAD_DIR, { recursive: true })
}

/**
 * 创建上传路由
 *
 * @param db - SQLite 数据库实例
 * @returns Elysia 路由实例
 */
const createUploadRoutes = (db: Database) => {
  return new Elysia({ prefix: '/api' })
    .decorate('db', db)
    .use(jwt({ secret: JWT_SECRET }))
    /**
     * 上传图片文件
     *
     * 仅允许登录用户上传，支持 JPEG、PNG、GIF、WebP 格式
     * 文件大小限制为 5MB
     *
     * @param body.file - 图片文件
     * @returns 上传结果，包含文件访问 URL
     * @throws Error - 未登录、文件类型错误或文件过大时抛出
     * @example
     * ```typescript
     * const formData = new FormData()
     * formData.append('file', imageFile)
     * const res = await fetch('/api/upload', {
     *   method: 'POST',
     *   headers: { Authorization: `Bearer ${token}` },
     *   body: formData
     * })
     * ```
     */
    .post(
      '/upload',
      async ({ db: _db, jwt, headers }, { body }) => {
        const authHeader = headers.authorization
        if (!authHeader?.startsWith('Bearer ')) {
          throw new Error('Unauthorized')
        }

        const token = authHeader.slice(7)
        const payload = await jwt.verify(token)

        if (!payload) {
          throw new Error('Invalid token')
        }

        const file = body.file
        if (!file) {
          throw new Error('No file provided')
        }

        /** 支持的图片 MIME 类型 */
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!validTypes.includes(file.type)) {
          throw new Error('Invalid file type')
        }

        /** 最大文件大小：5MB */
        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
          throw new Error('File too large (max 5MB)')
        }

        /** 生成唯一文件名：时间戳 + 随机字符串 + 扩展名 */
        const ext = file.type.split('/')[1]
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
        const filePath = join(UPLOAD_DIR, filename)
        const arrayBuffer = await file.arrayBuffer()
        await writeFile(filePath, Buffer.from(arrayBuffer))

        return {
          success: true,
          url: `/public/uploads/${filename}`,
        }
      },
      {
        body: t.Object({
          file: t.File(),
        }),
      },
    )
}

/** 导出上传路由创建函数 */
export const uploadRoutes = createUploadRoutes