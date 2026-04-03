import type { Database } from 'bun:sqlite'
import { jwt } from '@elysiajs/jwt'
import { Elysia, t } from 'elysia'

const JWT_SECRET = 'your-super-secret-key-change-in-production'

interface CommentWithAuthor {
  id: number
  content: string
  post_id: number
  author_id: number
  parent_id?: number
  created_at: string
  author?: {
    id: number
    username: string
    email: string
    avatar?: string
    bio?: string
    created_at: string
  }
}

const createCommentsRoutes = (db: Database) => {
  return new Elysia({ prefix: '/api' })
    .decorate('db', db)
    .use(jwt({ secret: JWT_SECRET }))
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

export const commentsRoutes = createCommentsRoutes
