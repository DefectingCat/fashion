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
const db = new Database('blog.db', { create: true })

// 同步模式设为 FULL 确保数据持久化
db.exec('PRAGMA synchronous = FULL')
// 尝试使用 DELETE 日志模式
db.exec('PRAGMA journal_mode = DELETE')

// 初始化数据库表结构
initSchema(db)

export default db
