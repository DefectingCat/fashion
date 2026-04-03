/**
 * @file 数据库统计 API 路由
 * @description 提供博客系统的数据统计信息
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import { Elysia } from 'elysia'
import type { Database } from 'bun:sqlite'

const createStatsRoutes = (db: Database) => {
  return new Elysia({ prefix: '/api/stats' }).decorate('db', db).get('/', ({ db }) => {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
    const postCount = db.prepare('SELECT COUNT(*) as count FROM posts').get() as { count: number }
    const publishedCount = db
      .prepare('SELECT COUNT(*) as count FROM posts WHERE published = 1')
      .get() as { count: number }
    const draftCount = db
      .prepare('SELECT COUNT(*) as count FROM posts WHERE published = 0')
      .get() as { count: number }
    const tagCount = db.prepare('SELECT COUNT(*) as count FROM tags').get() as { count: number }
    const commentCount = db.prepare('SELECT COUNT(*) as count FROM comments').get() as {
      count: number
    }

    return {
      success: true,
      stats: {
        users: userCount.count,
        posts: postCount.count,
        publishedPosts: publishedCount.count,
        draftPosts: draftCount.count,
        tags: tagCount.count,
        comments: commentCount.count,
      },
    }
  })
}

export const statsRoutes = createStatsRoutes
