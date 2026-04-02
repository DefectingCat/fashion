import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";

const JWT_SECRET = "your-super-secret-key-change-in-production";

export const commentsRoutes = new Elysia({ prefix: "/api" })
  .use(jwt({ secret: JWT_SECRET }))
  .get(
    "/posts/:id/comments",
    async ({ db, params }) => {
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
      `);
      const comments = stmt.all(params.id);
      return comments.map((c: any) => ({
        id: c.id,
        content: c.content,
        post_id: c.post_id,
        author_id: c.author_id,
        parent_id: c.parent_id,
        created_at: c.created_at,
        author: c.author_id ? {
          id: c.author_id,
          username: c.author_username,
          email: c.author_email,
          avatar: c.author_avatar,
          bio: c.author_bio,
          created_at: c.author_created_at,
        } : undefined,
      }));
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  .post(
    "/posts/:id/comments",
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
        .get(result.lastInsertRowid);

      return {
        id: newComment.id,
        content: newComment.content,
        post_id: newComment.post_id,
        author_id: newComment.author_id,
        parent_id: newComment.parent_id,
        created_at: newComment.created_at,
        author: newComment.author_id ? {
          id: newComment.author_id,
          username: newComment.author_username,
          email: newComment.author_email,
          avatar: newComment.author_avatar,
          bio: newComment.author_bio,
          created_at: newComment.author_created_at,
        } : undefined,
      };
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
    "/comments/:commentId",
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
        commentId: t.String(),
      }),
    },
  );
