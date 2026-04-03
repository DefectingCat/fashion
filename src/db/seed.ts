/**
 * @file 数据库种子数据
 * @description 初始化数据库的测试数据，包括用户、文章、标签和评论
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import db from './index'
import bcrypt from 'bcrypt'

/**
 * 播种数据库初始数据
 *
 * 插入测试用户、文章、标签和评论数据
 * 使用 INSERT OR IGNORE 避免重复插入
 */
export async function seedDatabase() {
  console.log('🌱 开始播种数据库...')

  // 使用 bcrypt 哈希密码，盐值 rounds 设为 10
  // 越高越安全但越慢，10 是安全性和性能的平衡点
  const hashedAdminPassword = await bcrypt.hash('admin123', 10)
  const hashedZhangsanPassword = await bcrypt.hash('zhangsan123', 10)

  // 插入测试用户
  const userStmt = db.prepare(`
    INSERT OR IGNORE INTO users (username, email, password, avatar, bio)
    VALUES (?, ?, ?, ?, ?)
  `)

  userStmt.run(
    'admin',
    'admin@example.com',
    hashedAdminPassword,
    'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    '博客管理员，热爱写作与分享',
  )

  userStmt.run(
    'zhangsan',
    'zhangsan@example.com',
    hashedZhangsanPassword,
    'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan',
    '前端开发工程师，专注于 React 和 TypeScript',
  )

  // 插入测试文章
  const postStmt = db.prepare(`
    INSERT OR IGNORE INTO posts (title, slug, content, excerpt, cover_image, published, author_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  postStmt.run(
    '欢迎来到我的博客',
    'welcome-to-my-blog',
    '# 欢迎\n\n这是我的第一篇博客文章！很高兴你能来到这里。\n\n## 关于这个博客\n\n这个博客使用 Bun、Elysia 和 React SSR 构建。\n\n### 技术栈\n\n- Bun - 极速 JavaScript 运行时\n- Elysia - TypeScript 优先的 Web 框架\n- React - 用于构建用户界面的库\n- Tailwind CSS - 实用优先的 CSS 框架\n\n希望你在这里能找到有用的内容！',
    '这是我的第一篇博客文章，介绍了这个博客的技术栈和愿景。',
    'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=400&fit=crop',
    1,
    1,
  )

  postStmt.run(
    'React 19 新特性详解',
    'react-19-new-features',
    '# React 19 新特性\n\nReact 19 带来了许多令人兴奋的新特性，让我们一起来看看！\n\n## 主要更新\n\n### 1. Actions\n\n新的 Actions API 让处理表单提交变得更加简单。\n\n### 2. useOptimistic\n\n乐观更新 Hook 让你可以在请求完成前就更新 UI。\n\n这些新特性将大大提升开发体验！',
    'React 19 带来了 Actions、useOptimistic 等强大的新特性，本文详细介绍了这些更新。',
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop',
    1,
    2,
  )

  postStmt.run(
    'TypeScript 5.0 新特性',
    'typescript-5-new-features',
    '# TypeScript 5.0 新特性\n\nTypeScript 5.0 带来了许多性能改进和新特性！\n\n## 性能提升\n\n- 构建速度提升约 30-50%\n- 内存使用减少约 40%\n\n## 新特性\n\n### const 类型参数\n\nTypeScript 5.0 支持 const 类型参数。\n\n### 装饰器\n\nTypeScript 5.0 正式支持 ECMAScript 装饰器。\n\nTypeScript 5.0 是一个巨大的进步！',
    'TypeScript 5.0 带来了显著的性能提升和 const 类型参数、装饰器等新特性。',
    'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=400&fit=crop',
    1,
    2,
  )

  // 插入测试标签
  const tagStmt = db.prepare(`
    INSERT OR IGNORE INTO tags (name)
    VALUES (?)
  `)

  tagStmt.run('React')
  tagStmt.run('TypeScript')
  tagStmt.run('Bun')
  tagStmt.run('Elysia')
  tagStmt.run('前端')
  tagStmt.run('教程')

  // 关联文章和标签
  const postTagStmt = db.prepare(`
    INSERT OR IGNORE INTO post_tags (post_id, tag_id)
    VALUES (?, ?)
  `)

  postTagStmt.run(1, 3)
  postTagStmt.run(1, 4)
  postTagStmt.run(1, 5)
  postTagStmt.run(2, 1)
  postTagStmt.run(2, 5)
  postTagStmt.run(2, 6)
  postTagStmt.run(3, 2)
  postTagStmt.run(3, 5)
  postTagStmt.run(3, 6)

  // 插入测试评论
  const commentStmt = db.prepare(`
    INSERT OR IGNORE INTO comments (content, post_id, author_id)
    VALUES (?, ?, ?)
  `)

  commentStmt.run('写得很棒！期待更多内容。', 1, 2)
  commentStmt.run('React 19 确实很强大！', 2, 1)
  commentStmt.run('TypeScript 5.0 的性能提升太明显了。', 3, 1)

  console.log('✅ 数据库播种完成！')
}
