import { Elysia, t } from "elysia";

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .post(
    "/register",
    async ({ db, body }) => {
      const stmt = db.prepare(`
        INSERT INTO users (username, email, password)
        VALUES (?, ?, ?)
      `);

      try {
        const result = stmt.run(
          body.username,
          body.email,
          body.password,
        );

        const newUser = db
          .prepare("SELECT id, username, email, created_at FROM users WHERE id = ?")
          .get(result.lastInsertRowid);
        
        return { success: true, user: newUser };
      } catch (error) {
        throw new Error("Username or email already exists");
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
    async ({ db, body }) => {
      const stmt = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?");
      const user = stmt.get(body.email, body.password);

      if (!user) {
        throw new Error("Invalid credentials");
      }

      const { password, ...userWithoutPassword } = user as any;
      return { success: true, user: userWithoutPassword };
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    },
  );
