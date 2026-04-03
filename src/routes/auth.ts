/**
 * @file 用户认证 API 路由
 * @description 提供用户注册、登录、JWT token 验证和个人信息获取功能
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import type { Database } from 'bun:sqlite'
import { jwt } from '@elysiajs/jwt'
import bcrypt from 'bcrypt'
import { Elysia, t } from 'elysia'
import { requireJwtSecret } from '../utils/env'

const JWT_SECRET = requireJwtSecret()

/**
 * 创建认证路由
 *
 * @param db - SQLite 数据库实例
 * @returns Elysia 路由实例
 */
const createAuthRoutes = (db: Database) => {
  return new Elysia({ prefix: '/api/auth' })
    .decorate('db', db)
    .use(jwt({ secret: JWT_SECRET }))
    /**
     * 用户注册
     *
     * 创建新用户账号，使用 bcrypt 哈希密码
     *
     * @param body.username - 用户名
     * @param body.email - 用户邮箱
     * @param body.password - 用户密码（将被哈希存储）
     * @returns 注册结果，包含用户信息和 JWT token
     * @throws Error - 用户名或邮箱已存在时抛出
     */
    .post(
      '/register',
      async ({ db, body, jwt }) => {
        const hashedPassword = await bcrypt.hash(body.password, 10)

        const stmt = db.prepare(`
          INSERT INTO users (username, email, password)
          VALUES (?, ?, ?)
        `)

        try {
          const result = stmt.run(body.username, body.email, hashedPassword)

          const newUser = db
            .prepare('SELECT id, username, email, created_at FROM users WHERE id = ?')
            .get(result.lastInsertRowid) as
            | { id: number; username: string; email: string; created_at: string }
            | undefined

          if (!newUser) {
            throw new Error('Failed to create user')
          }

          const token = await jwt.sign({
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
          })

          return { success: true, user: newUser, token }
        } catch (error: unknown) {
          if (error instanceof Error && error.message?.includes('UNIQUE constraint')) {
            throw new Error('Username or email already exists')
          }
          throw error
        }
      },
      {
        body: t.Object({
          username: t.String(),
          email: t.String(),
          password: t.String(),
        }),
      },
    )
    /**
     * 用户登录
     *
     * 验证用户凭证，验证成功后返回 JWT token
     *
     * @param body.email - 用户邮箱
     * @param body.password - 用户密码
     * @returns 登录结果，包含用户信息（不含密码）和 JWT token
     * @throws Error - 邮箱或密码错误时抛出
     */
    .post(
      '/login',
      async ({ db, body, jwt }) => {
        const stmt = db.prepare('SELECT * FROM users WHERE email = ?')
        const user = stmt.get(body.email) as Record<string, unknown> | undefined

        if (!user) {
          throw new Error('Invalid credentials')
        }

        const passwordValid = await bcrypt.compare(body.password, user.password as string)
        if (!passwordValid) {
          throw new Error('Invalid credentials')
        }

        const token = await jwt.sign({
          id: user.id as number,
          username: user.username as string,
          email: user.email as string,
        })

        const { password, ...userWithoutPassword } = user
        return { success: true, user: userWithoutPassword, token }
      },
      {
        body: t.Object({
          email: t.String(),
          password: t.String(),
        }),
      },
    )
    /**
     * 获取当前用户信息
     *
     * 通过 JWT token 验证用户身份，返回用户详细信息
     *
     * @param headers.authorization - Bearer token
     * @returns 用户信息
     * @throws Error - token 无效或用户不存在时抛出
     */
    .get('/me', async ({ db, jwt, headers }) => {
      const authHeader = headers.authorization
      if (!authHeader?.startsWith('Bearer ')) {
        throw new Error('Unauthorized')
      }

      const token = authHeader.slice(7)
      const payload = await jwt.verify(token)

      if (!payload) {
        throw new Error('Invalid token')
      }

      const stmt = db.prepare(
        'SELECT id, username, email, avatar, bio, created_at FROM users WHERE id = ?',
      )
      const user = stmt.get(payload.id as number)

      if (!user) {
        throw new Error('User not found')
      }

      return { success: true, user }
    })
}

/** 导出认证路由创建函数 */
export const authRoutes = createAuthRoutes