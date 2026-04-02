import { Database } from "bun:sqlite";
import { initSchema } from "./schema";

const db = new Database("blog.db");

db.exec("PRAGMA journal_mode = WAL");

initSchema(db);

export default db;
