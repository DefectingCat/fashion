import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

const JWT_SECRET = "your-super-secret-key-change-in-production";
const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

if (!existsSync(UPLOAD_DIR)) {
  mkdir(UPLOAD_DIR, { recursive: true });
}

export const uploadRoutes = new Elysia({ prefix: "/api" })
  .use(jwt({ secret: JWT_SECRET }))
  .post(
    "/upload",
    async ({ db, body, jwt, headers }) => {
      const authHeader = headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        throw new Error("Unauthorized");
      }

      const token = authHeader.slice(7);
      const payload = await jwt.verify(token);

      if (!payload) {
        throw new Error("Invalid token");
      }

      const file = body.file as File;
      if (!file) {
        throw new Error("No file provided");
      }

      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        throw new Error("Invalid file type");
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error("File too large (max 5MB)");
      }

      const ext = file.type.split("/")[1];
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const filePath = join(UPLOAD_DIR, filename);
      const arrayBuffer = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(arrayBuffer));

      return {
        success: true,
        url: `/public/uploads/${filename}`,
      };
    },
    {
      body: t.Object({
        file: t.File(),
      }),
    },
  );
