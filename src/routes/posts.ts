import { Elysia, t } from "elysia";
import type { Database } from "bun:sqlite";

const createPostsRoutes = (db: Database) => {
  return new Elysia({ prefix: "/api/posts" })
    .decorate("db", db)
    .get(
      "/",
      ({ db }) => {
        const stmt = db.prepare(
          "SELECT * FROM posts WHERE published = 1 ORDER BY created_at DESC",
        );
        const posts = stmt.all();
        return posts;
      },
    )
    .get(
      "/:id",
      ({ db, params }) => {
        const stmt = db.prepare("SELECT * FROM posts WHERE id = ?");
        const post = stmt.get(params.id);

        if (!post) {
          throw new Error("Post not found");
        }

        return post;
      },
      {
        params: t.Object({
          id: t.String(),
        }),
      },
    )
    .post(
      "/",
      ({ db, body }) => {
        const stmt = db.prepare(`
          INSERT INTO posts (title, slug, content, excerpt, cover_image, published, author_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const authorId = 1;
        const slug = body.title.toLowerCase().replace(/\s+/g, "-");

        const result = stmt.run(
          body.title,
          slug,
          body.content,
          body.excerpt || "",
          body.coverImage || "",
          body.published ? 1 : 0,
          authorId,
        );

        const newPost = db
          .prepare("SELECT * FROM posts WHERE id = ?")
          .get(result.lastInsertRowid);
        return newPost;
      },
      {
        body: t.Object({
          title: t.String(),
          content: t.String(),
          excerpt: t.Optional(t.String()),
          coverImage: t.Optional(t.String()),
          published: t.Optional(t.Boolean()),
        }),
      },
    )
    .put(
      "/:id",
      ({ db, params, body }) => {
        const checkStmt = db.prepare("SELECT * FROM posts WHERE id = ?");
        const post = checkStmt.get(params.id);

        if (!post) {
          throw new Error("Post not found");
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
        `);

        updateStmt.run(
          body.title || null,
          body.content || null,
          body.excerpt || null,
          body.coverImage || null,
          body.published !== undefined ? (body.published ? 1 : 0) : null,
          params.id,
        );

        const updatedPost = db
          .prepare("SELECT * FROM posts WHERE id = ?")
          .get(params.id);
        return updatedPost;
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
        }),
      },
    )
    .delete(
      "/:id",
      ({ db, params }) => {
        const checkStmt = db.prepare("SELECT * FROM posts WHERE id = ?");
        const post = checkStmt.get(params.id);

        if (!post) {
          throw new Error("Post not found");
        }

        const deleteStmt = db.prepare("DELETE FROM posts WHERE id = ?");
        deleteStmt.run(params.id);

        return { success: true, message: "Post deleted successfully" };
      },
      {
        params: t.Object({
          id: t.String(),
        }),
      },
    );
};

export const postsRoutes = createPostsRoutes;
