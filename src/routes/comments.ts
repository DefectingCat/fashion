import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";

const JWT_SECRET = "your-super-secret-key-change-in-production";

export const commentsRoutes = new Elysia({ prefix: "/api/posts" })
  .use(jwt({ secret: JWT_SECRET }))
  .get(
    "/:id/comments",
    async ({ db, params }) => {
      const stmt = db.prepare(`
        SELECT c.*, u.username as author_name, u.avatar as author_avatar
        FROM comments c
        LEFT JOIN users u ON c.author_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at DESC
      `);
      const comments = stmt.all(params.id);
      return { success: true, comments };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  .post(
    "/:id/comments",
    async ({ db, params, body, jwt, headers }) => {
      const authHeader = headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        throw new Error("Unauthorized");
      }

      const token = authHeader.slice(7);
      const payload = await jwt.verify(token);

      if (!payload) {
        throw new Error("Invalid token");
      }

      const stmt = db.prepare(`
        INSERT INTO comments (content, post_id, author_id, parent_id)
        VALUES (?, ?, ?, ?)
      `);

      const result = stmt.run(
        body.content,
        params.id,
        payload.id,
        body.parent_id || null,
      );

      const newComment = db
        .prepare(`
          SELECT c.*, u.username as author_name, u.avatar as author_avatar
          FROM comments c
          LEFT JOIN users u ON c.author_id = u.id
          WHERE c.id = ?
        `)
        .get(result.lastInsertRowid);

      return { success: true, comment: newComment };
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
    "/:id/comments/:commentId",
    async ({ db, params, jwt, headers }) => {
      const authHeader = headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        throw new Error("Unauthorized");
      }

      const token = authHeader.slice(7);
      const payload = await jwt.verify(token);

      if (!payload) {
        throw new Error("Invalid token");
      }

      const checkStmt = db.prepare("SELECT * FROM comments WHERE id = ? AND author_id = ?");
      const comment = checkStmt.get(params.commentId, payload.id);

      if (!comment) {
        throw new Error("Comment not found or unauthorized");
      }

      const deleteStmt = db.prepare("DELETE FROM comments WHERE id = ?");
      deleteStmt.run(params.commentId);

      return { success: true, message: "Comment deleted successfully" };
    },
    {
      params: t.Object({
        id: t.String(),
        commentId: t.String(),
      }),
    },
  );
