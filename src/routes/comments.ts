/**
 * @file 评论管理 API 路由
 * @description 提供评论的查询、创建和删除功能
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import type { Database } from 'bun:sqlite'
import { jwt } from '@elysiajs/jwt'
import { Elysia, t } from 'elysia'

/** JWT 密钥，用于验证用户身份 */
const JWT_SECRET = 'your-super-secret-key-change-in-production'

/**
 * 包含作者信息的评论数据结构
 */
interface CommentWithAuthor {
  /** 评论唯一 ID */
  id: number
  /** 评论内容 */
  content: string
  /** 所属文章 ID */
  post_id: number
  /** 评论作者 ID */
  author_id: number
  /** 父评论 ID，用于回复功能 */
  parent_id?: number
  /** 评论创建时间 */
  created_at: string
  /** 评论作者信息 */
  author?: {
    /** 作者 ID */
    id: number
    /** 作者用户名 */
    username: string
    /** 作者邮箱 */
    email: string
    /** 作者头像 URL */
    avatar?: string
    /** 作者个人简介 */
    bio?: string
    /** 作者账号创建时间 */
    created_at: string
  }
}

/**
 * 创建评论路由
 *
 * @param db - SQLite 数据库实例
 * @returns Elysia 路由实例
 */
const createCommentsRoutes = (db: Database) => {
  return new Elysia({ prefix: '/api' })
    .decorate('db', db)
    .use(jwt({ secret: JWT_SECRET }))
    /**
     * 获取文章的所有评论
     *
     * @param params.id - 文章 ID
     * @returns 评论列表，包含每条评论的作者信息
     */
    .get(
      '/posts/:id/comments',
      ({ db, params }) => {
        const stmt = db.prepare(`
          SELECT c.*,
                 u.id as author_id,
                 u.username as author_username,
                 u.email as author_email,
                 u.avatar as author_avatar,
                 u.bio as author_bio,
                 u.created_at as author_created_at
          FROM comments c
          LEFT JOIN users u ON c.author_id = u.id
          WHERE c.post_id = ?
          ORDER BY c.created_at DESC
        `)
        const comments = stmt.all(params.id) as Array<Record<string, unknown>>
        return comments.map(
          (c): CommentWithAuthor => ({
            id: c.id as number,
            content: c.content as string,
            post_id: c.post_id as number,
            author_id: c.author_id as number,
            parent_id: c.parent_id as number | undefined,
            created_at: c.created_at as string,
            author: c.author_id
              ? {
                  id: c.author_id as number,
                  username: c.author_username as string,
                  email: c.author_email as string,
                  avatar: c.author_avatar as string | undefined,
                  bio: c.author_bio as string | undefined,
                  created_at: c.author_created_at as string,
                }
              : undefined,
          }),
        )
      },
      {
        params: t.Object({
          id: t.String(),
        }),
      },
    )
    /**
     * 创建新评论
     *
     * 需要用户登录，评论会自动关联到当前登录用户
     *
     * @param params.id - 文章 ID
     * @param body.content - 评论内容
     * @param body.parent_id - 父评论 ID（可选，用于回复功能）
     * @returns 创建的评论信息
     * @throws Error - 未登录或 token 无效时抛出
     */
    .post(
      '/posts/:id/comments',
      async ({ db, params, body, jwt, headers }) => {
        const authHeader = headers.authorization
        if (!authHeader?.startsWith('Bearer ')) {
          throw new Error('Unauthorized')
        }

        const token = authHeader.slice(7)
        const payload = await jwt.verify(token)

        if (!payload) {
          throw new Error('Invalid token')
        }

        const stmt = db.prepare(`
          INSERT INTO comments (content, post_id, author_id, parent_id)
          VALUES (?, ?, ?, ?)
        `)

        const result = stmt.run(
          body.content,
          params.id,
          payload.id as number,
          body.parent_id || null,
        )

        const newComment = db
          .prepare(`
            SELECT c.*,
                   u.id as author_id,
                   u.username as author_username,
                   u.email as author_email,
                   u.avatar as author_avatar,
                   u.bio as author_bio,
                   u.created_at as author_created_at
            FROM comments c
            LEFT JOIN users u ON c.author_id = u.id
            WHERE c.id = ?
          `)
          .get(result.lastInsertRowid) as Record<string, unknown> | undefined

        if (!newComment) {
          throw new Error('Failed to create comment')
        }

        return {
          id: newComment.id as number,
          content: newComment.content as string,
          post_id: newComment.post_id as number,
          author_id: newComment.author_id as number,
          parent_id: newComment.parent_id as number | undefined,
          created_at: newComment.created_at as string,
          author: newComment.author_id
            ? {
                id: newComment.author_id as number,
                username: newComment.author_username as string,
                email: newComment.author_email as string,
                avatar: newComment.author_avatar as string | undefined,
                bio: newComment.author_bio as string | undefined,
                created_at: newComment.author_created_at as string,
              }
            : undefined,
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          content: t.String(),
          parent_id: t.Optional(t.Number()),
        }),
      },
    )
    /**
     * 删除评论
     *
     * 只有评论作者才能删除自己的评论
     *
     * @param params.commentId - 评论 ID
     * @returns 删除成功结果
     * @throws Error - 未登录、无权限或评论不存在时抛出
     */
    .delete(
      '/comments/:commentId',
      async ({ db, params, jwt, headers }) => {
        const authHeader = headers.authorization
        if (!authHeader?.startsWith('Bearer ')) {
          throw new Error('Unauthorized')
        }

        const token = authHeader.slice(7)
        const payload = await jwt.verify(token)

        if (!payload) {
          throw new Error('Invalid token')
        }

        const checkStmt = db.prepare('SELECT * FROM comments WHERE id = ? AND author_id = ?')
        const comment = checkStmt.get(params.commentId, payload.id as number)

        if (!comment) {
          throw new Error('Comment not found or unauthorized')
        }

        const deleteStmt = db.prepare('DELETE FROM comments WHERE id = ?')
        deleteStmt.run(params.commentId)

        return { success: true, message: 'Comment deleted successfully' }
      },
      {
        params: t.Object({
          commentId: t.String(),
        }),
      },
    )
}

/** 导出评论路由创建函数 */
export const commentsRoutes = createCommentsRoutes