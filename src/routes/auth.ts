import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import bcrypt from "bcrypt";

const JWT_SECRET = "your-super-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .use(jwt({ secret: JWT_SECRET }))
  .post(
    "/register",
    async ({ db, body, jwt }) => {
      const hashedPassword = await bcrypt.hash(body.password, 10);

      const stmt = db.prepare(`
        INSERT INTO users (username, email, password)
        VALUES (?, ?, ?)
      `);

      try {
        const result = stmt.run(
          body.username,
          body.email,
          hashedPassword,
        );

        const newUser = db
          .prepare("SELECT id, username, email, created_at FROM users WHERE id = ?")
          .get(result.lastInsertRowid) as any;

        const token = await jwt.sign({
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
        });

        return { success: true, user: newUser, token };
      } catch (error: any) {
        if (error.message?.includes("UNIQUE constraint")) {
          throw new Error("Username or email already exists");
        }
        throw error;
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
    "/login",
    async ({ db, body, jwt }) => {
      const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
      const user = stmt.get(body.email) as any;

      if (!user) {
        throw new Error("Invalid credentials");
      }

      const passwordValid = await bcrypt.compare(body.password, user.password);
      if (!passwordValid) {
        throw new Error("Invalid credentials");
      }

      const token = await jwt.sign({
        id: user.id,
        username: user.username,
        email: user.email,
      });

      const { password, ...userWithoutPassword } = user;
      return { success: true, user: userWithoutPassword, token };
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    },
  )
  .get(
    "/me",
    async ({ db, jwt, headers }) => {
      const authHeader = headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        throw new Error("Unauthorized");
      }

      const token = authHeader.slice(7);
      const payload = await jwt.verify(token);

      if (!payload) {
        throw new Error("Invalid token");
      }

      const stmt = db.prepare("SELECT id, username, email, avatar, bio, created_at FROM users WHERE id = ?");
      const user = stmt.get(payload.id);

      if (!user) {
        throw new Error("User not found");
      }

      return { success: true, user };
    },
  );
