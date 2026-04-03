/**
 * @file 标签管理 API 路由
 * @description 提供标签的 CRUD 操作和文章标签关联功能
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import { Elysia, t } from 'elysia'
import type { Database } from 'bun:sqlite'

const createTagsRoutes = (db: Database) => {
  return (
    new Elysia({ prefix: '/api/tags' })
      .decorate('db', db)
      /**
       * 获取所有标签列表
       * 包含每个标签关联的文章数量
       */
      .get('/', ({ db }) => {
        const stmt = db.prepare(`
        SELECT t.*, COUNT(pt.post_id) as post_count
        FROM tags t
        LEFT JOIN post_tags pt ON t.id = pt.tag_id
        GROUP BY t.id
        ORDER BY post_count DESC
      `)
        const tags = stmt.all()
        return { success: true, tags }
      })
      /**
       * 获取单个标签详情
       */
      .get('/:id', ({ db, params }) => {
        const stmt = db.prepare(`
        SELECT t.*, COUNT(pt.post_id) as post_count
        FROM tags t
        LEFT JOIN post_tags pt ON t.id = pt.tag_id
        WHERE t.id = ?
        GROUP BY t.id
      `)
        const tag = stmt.get(params.id)
        if (!tag) {
          throw new Error('Tag not found')
        }
        return { success: true, tag }
      })
      /**
       * 获取指定标签下的所有文章
       */
      .get('/:id/posts', ({ db, params }) => {
        const stmt = db.prepare(`
        SELECT p.*
        FROM posts p
        INNER JOIN post_tags pt ON p.id = pt.post_id
        WHERE pt.tag_id = ? AND p.published = 1
        ORDER BY p.created_at DESC
      `)
        const posts = stmt.all(params.id)
        return { success: true, posts }
      })
      /**
       * 创建新标签
       */
      .post(
        '/',
        ({ db, body }) => {
          const stmt = db.prepare(`
          INSERT INTO tags (name, color) VALUES (?, ?)
        `)

          try {
            const result = stmt.run(body.name, body.color || null)
            const newTag = db.prepare('SELECT * FROM tags WHERE id = ?').get(result.lastInsertRowid)
            return { success: true, tag: newTag }
          } catch (error: unknown) {
            if (error instanceof Error && error.message?.includes('UNIQUE constraint')) {
              throw new Error('Tag already exists')
            }
            throw error
          }
        },
        {
          body: t.Object({
            name: t.String({
              minLength: 1,
              maxLength: 50,
            }),
            color: t.Optional(t.String()),
          }),
        },
      )
      /**
       * 更新标签
       */
      .put(
        '/:id',
        ({ db, params, body }) => {
          const checkStmt = db.prepare('SELECT * FROM tags WHERE id = ?')
          const tag = checkStmt.get(params.id)

          if (!tag) {
            throw new Error('Tag not found')
          }

          const updateStmt = db.prepare(`
          UPDATE tags 
          SET name = COALESCE(?, name),
              color = COALESCE(?, color)
          WHERE id = ?
        `)

          try {
            updateStmt.run(body.name || null, body.color || null, params.id)
            const updatedTag = db.prepare('SELECT * FROM tags WHERE id = ?').get(params.id)
            return { success: true, tag: updatedTag }
          } catch (error: unknown) {
            if (error instanceof Error && error.message?.includes('UNIQUE constraint')) {
              throw new Error('Tag name already exists')
            }
            throw error
          }
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          body: t.Object({
            name: t.Optional(
              t.String({
                minLength: 1,
                maxLength: 50,
              }),
            ),
            color: t.Optional(t.String()),
          }),
        },
      )
      /**
       * 删除标签
       */
      .delete(
        '/:id',
        ({ db, params }) => {
          const checkStmt = db.prepare('SELECT * FROM tags WHERE id = ?')
          const tag = checkStmt.get(params.id)

          if (!tag) {
            throw new Error('Tag not found')
          }

          // 删除标签前先删除关联
          const deleteRelStmt = db.prepare('DELETE FROM post_tags WHERE tag_id = ?')
          deleteRelStmt.run(params.id)

          // 删除标签
          const deleteStmt = db.prepare('DELETE FROM tags WHERE id = ?')
          deleteStmt.run(params.id)

          return { success: true, message: 'Tag deleted successfully' }
        },
        {
          params: t.Object({
            id: t.String(),
          }),
        },
      )
  )
}

export const tagsRoutes = createTagsRoutes
