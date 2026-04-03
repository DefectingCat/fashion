/**
 * @file 数据库连接初始化
 * @description 创建并配置 SQLite 数据库连接
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import { Database } from 'bun:sqlite'
import { initSchema } from './schema'

/**
 * SQLite 数据库实例
 *
 * 使用 WAL (Write-Ahead Logging) 模式提升并发性能
 */
const db = new Database('blog.db')

// 启用 WAL 模式，提升并发读写性能
db.exec('PRAGMA journal_mode = WAL')

// 初始化数据库表结构
initSchema(db)

export default db
