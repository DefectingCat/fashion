import type { Database } from 'bun:sqlite'
import { jwt } from '@elysiajs/jwt'
import bcrypt from 'bcrypt'
import { Elysia, t } from 'elysia'

const JWT_SECRET = 'your-super-secret-key-change-in-production'
const _JWT_EXPIRES_IN = '7d'

const createAuthRoutes = (db: Database) => {
  return new Elysia({ prefix: '/api/auth' })
    .decorate('db', db)
    .use(jwt({ secret: JWT_SECRET }))
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

export const authRoutes = createAuthRoutes
