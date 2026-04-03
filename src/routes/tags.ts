import { Elysia, t } from "elysia";
import type { Database } from "bun:sqlite";

const createTagsRoutes = (db: Database) => {
  return new Elysia({ prefix: "/api/tags" })
    .decorate("db", db)
    .get("/", ({ db }) => {
      const stmt = db.prepare(`
        SELECT t.*, COUNT(pt.post_id) as post_count
        FROM tags t
        LEFT JOIN post_tags pt ON t.id = pt.tag_id
        GROUP BY t.id
        ORDER BY post_count DESC
      `);
      const tags = stmt.all();
      return { success: true, tags };
    })
    .get("/:id", ({ db, params }) => {
      const stmt = db.prepare(`
        SELECT t.*, COUNT(pt.post_id) as post_count
        FROM tags t
        LEFT JOIN post_tags pt ON t.id = pt.tag_id
        WHERE t.id = ?
        GROUP BY t.id
      `);
      const tag = stmt.get(params.id);
      if (!tag) {
        throw new Error("Tag not found");
      }
      return { success: true, tag };
    })
    .get("/:id/posts", ({ db, params }) => {
      const stmt = db.prepare(`
        SELECT p.*
        FROM posts p
        INNER JOIN post_tags pt ON p.id = pt.post_id
        WHERE pt.tag_id = ? AND p.published = 1
        ORDER BY p.created_at DESC
      `);
      const posts = stmt.all(params.id);
      return { success: true, posts };
    })
    .post("/", ({ db, body }) => {
      const stmt = db.prepare(`
        INSERT INTO tags (name) VALUES (?)
      `);

      try {
        const result = stmt.run(body.name);
        const newTag = db
          .prepare("SELECT * FROM tags WHERE id = ?")
          .get(result.lastInsertRowid);
        return { success: true, tag: newTag };
      } catch (error: unknown) {
        if (error instanceof Error && error.message?.includes("UNIQUE constraint")) {
          throw new Error("Tag already exists");
        }
        throw error;
      }
    }, {
      body: t.Object({
        name: t.String(),
      }),
    });
};

export const tagsRoutes = createTagsRoutes;
