/**
 * @file 文章管理 API 路由
 * @description 提供文章的 CRUD 操作和标签关联功能
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import type { Database } from 'bun:sqlite'
import { Elysia, t } from 'elysia'
import type { Post } from '../types'

const createPostsRoutes = (db: Database) => {
  return (
    new Elysia({ prefix: '/api/posts' })
      .decorate('db', db)
      /**
       * 获取所有已发布文章列表
       * 包含关联的标签信息
       */
      .get('/', ({ db }) => {
        const postsWithTagsStmt = db.prepare(`
          SELECT p.*, GROUP_CONCAT(t.id) as tag_ids, GROUP_CONCAT(t.name) as tag_names, GROUP_CONCAT(t.color) as tag_colors
          FROM posts p
          LEFT JOIN post_tags pt ON p.id = pt.post_id
          LEFT JOIN tags t ON t.id = pt.tag_id
          WHERE p.published = 1
          GROUP BY p.id
          ORDER BY p.created_at DESC
        `)

        const posts = postsWithTagsStmt.all() as (Post & { tag_ids: string | null; tag_names: string | null; tag_colors: string | null })[]

        return posts.map((post) => {
          const tagIds = post.tag_ids ? post.tag_ids.split(',').map(Number) : []
          const tagNames = post.tag_names ? post.tag_names.split(',') : []
          const tagColors = post.tag_colors ? post.tag_colors.split(',') : []

          return {
            ...post,
            tags: tagIds.map((id, index) => ({
              id,
              name: tagNames[index],
              color: tagColors[index],
            })),
          }
        })
      })
      /**
       * 获取单篇文章详情
       * 包含关联的标签信息
       */
      .get(
        '/:idOrSlug',
        ({ db, params }) => {
          const isNumeric = /^\d+$/.test(params.idOrSlug);
          let post: Post | null;

          if (isNumeric) {
            const postStmt = db.prepare('SELECT * FROM posts WHERE id = ?');
            post = postStmt.get(params.idOrSlug) as Post | null;
          } else {
            const postStmt = db.prepare('SELECT * FROM posts WHERE slug = ?');
            post = postStmt.get(params.idOrSlug) as Post | null;
          }

          if (!post) {
            throw new Error('Post not found');
          }

          const tagsStmt = db.prepare(`
          SELECT t.* FROM tags t
          INNER JOIN post_tags pt ON t.id = pt.tag_id
          WHERE pt.post_id = ?
        `);
          const tags = tagsStmt.all(post.id);

          return { ...post, tags };
        },
        {
          params: t.Object({
            idOrSlug: t.String(),
          }),
        },
      )
      /**
       * 创建新文章
       * 支持同时关联标签
       */
      .post(
        '/',
        ({ db, body }) => {
          const stmt = db.prepare(`
          INSERT INTO posts (title, slug, content, excerpt, cover_image, published, author_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)

          const authorId = 1
          const slug = body.title.toLowerCase().replace(/\s+/g, '-')

          const result = stmt.run(
            body.title,
            slug,
            body.content,
            body.excerpt || '',
            body.coverImage || '',
            body.published ? 1 : 0,
            authorId,
          )

          const postId = result.lastInsertRowid

          // 如果提供了标签，建立关联
          if (body.tagIds && body.tagIds.length > 0) {
            const tagRelStmt = db.prepare(
              'INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)',
            )
            body.tagIds.forEach((tagId: number) => {
              tagRelStmt.run(postId, tagId)
            })
          }

          // 返回创建的文章（包含标签）
          const newPost = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId) as Post | null
          const tagsStmt = db.prepare(`
          SELECT t.* FROM tags t
          INNER JOIN post_tags pt ON t.id = pt.tag_id
          WHERE pt.post_id = ?
        `)
          const tags = tagsStmt.all(postId)

          return { ...newPost, tags }
        },
        {
          body: t.Object({
            title: t.String(),
            content: t.String(),
            excerpt: t.Optional(t.String()),
            coverImage: t.Optional(t.String()),
            published: t.Optional(t.Boolean()),
            tagIds: t.Optional(t.Array(t.Number())),
          }),
        },
      )
      /**
       * 更新文章
       * 支持更新标签关联
       */
      .put(
        '/:id',
        ({ db, params, body }) => {
          const checkStmt = db.prepare('SELECT * FROM posts WHERE id = ?')
          const post = checkStmt.get(params.id) as Post | null

          if (!post) {
            throw new Error('Post not found')
          }

          const updateStmt = db.prepare(`
          UPDATE posts 
          SET title = COALESCE(?, title),
              content = COALESCE(?, content),
              excerpt = COALESCE(?, excerpt),
              cover_image = COALESCE(?, cover_image),
              published = COALESCE(?, published),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)

          updateStmt.run(
            body.title || null,
            body.content || null,
            body.excerpt || null,
            body.coverImage || null,
            body.published !== undefined ? (body.published ? 1 : 0) : null,
            params.id,
          )

          // 如果提供了标签，更新关联
          if (body.tagIds !== undefined) {
            // 先删除旧关联
            const deleteRelStmt = db.prepare('DELETE FROM post_tags WHERE post_id = ?')
            deleteRelStmt.run(params.id)

            // 添加新关联
            if (body.tagIds.length > 0) {
              const tagRelStmt = db.prepare(
                'INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)',
              )
              body.tagIds.forEach((tagId: number) => {
                tagRelStmt.run(params.id, tagId)
              })
            }
          }

          // 返回更新后的文章（包含标签）
          const updatedPost = db
            .prepare('SELECT * FROM posts WHERE id = ?')
            .get(params.id) as Post | null
          const tagsStmt = db.prepare(`
          SELECT t.* FROM tags t
          INNER JOIN post_tags pt ON t.id = pt.tag_id
          WHERE pt.post_id = ?
        `)
          const tags = tagsStmt.all(params.id)

          return { ...updatedPost, tags }
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          body: t.Object({
            title: t.Optional(t.String()),
            content: t.Optional(t.String()),
            excerpt: t.Optional(t.String()),
            coverImage: t.Optional(t.String()),
            published: t.Optional(t.Boolean()),
            tagIds: t.Optional(t.Array(t.Number())),
          }),
        },
      )
      /**
       * 删除文章
       * 同时删除文章标签关联
       */
      .delete(
        '/:id',
        ({ db, params }) => {
          const checkStmt = db.prepare('SELECT * FROM posts WHERE id = ?')
          const post = checkStmt.get(params.id) as Post | null

          if (!post) {
            throw new Error('Post not found')
          }

          // 先删除文章标签关联
          const deleteRelStmt = db.prepare('DELETE FROM post_tags WHERE post_id = ?')
          deleteRelStmt.run(params.id)

          // 再删除文章
          const deleteStmt = db.prepare('DELETE FROM posts WHERE id = ?')
          deleteStmt.run(params.id)

          return { success: true, message: 'Post deleted successfully' }
        },
        {
          params: t.Object({
            id: t.String(),
          }),
        },
      )
  )
}

export const postsRoutes = createPostsRoutes
