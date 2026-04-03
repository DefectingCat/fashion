/**
 * @file 项目类型定义
 * @description 定义项目中使用的所有数据结构和类型
 * @author Fashion Blog Team
 * @created 2024-01-01
 */

import type { Database } from "bun:sqlite";

/**
 * 用户数据结构
 */
export interface User {
  /** 用户唯一 ID */
  id: number;

  /** 用户名 */
  username: string;

  /** 用户邮箱 */
  email: string;

  /** 用户头像 URL */
  avatar?: string;

  /** 用户个人简介 */
  bio?: string;

  /** 账号创建时间 */
  created_at: string;

  /** 账号最后更新时间 */
  updated_at: string;
}

/**
 * 文章数据结构
 */
export interface Post {
  /** 文章唯一 ID */
  id: number;

  /** 文章标题 */
  title: string;

  /** URL 别名，用于生成友好的文章链接 */
  slug: string;

  /** 文章内容，Markdown 格式 */
  content: string;

  /** 文章摘要，简短描述 */
  excerpt?: string;

  /** 封面图片 URL */
  cover_image?: string;

  /** 是否已发布：1 已发布，0 草稿 */
  published: number;

  /** 作者用户 ID，关联 users 表 */
  author_id: number;

  /** 文章创建时间 */
  created_at: string;

  /** 文章最后更新时间 */
  updated_at: string;
}

/**
 * 评论数据结构
 */
export interface Comment {
  /** 评论唯一 ID */
  id: number;

  /** 评论内容 */
  content: string;

  /** 所属文章 ID，关联 posts 表 */
  post_id: number;

  /** 评论作者 ID，关联 users 表 */
  author_id: number;

  /** 父评论 ID，用于支持回复功能，顶级评论为 null */
  parent_id?: number;

  /** 评论创建时间 */
  created_at: string;
}

/**
 * 标签数据结构
 */
export interface Tag {
  /** 标签唯一 ID */
  id: number;

  /** 标签名称 */
  name: string;
}

/**
 * 服务端渲染数据结构
 *
 * 用于在服务端预取数据并传递给客户端
 */
export interface SSRData {
  /** 文章列表数据 */
  posts?: Post[];

  /** 单篇文章详情数据 */
  post?: Post | null;

  /** 扩展字段，用于未来添加其他 SSR 数据 */
  [key: string]: unknown;
}

/**
 * Elysia 装饰器类型
 *
 * 用于在 Elysia 路由中访问数据库等依赖
 */
export interface ElysiaDecorators {
  /** SQLite 数据库实例 */
  db: Database;
}
