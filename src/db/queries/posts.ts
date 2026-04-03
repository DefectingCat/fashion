import type { Database } from 'bun:sqlite';
import type { Post, Tag } from '../../types';

export interface PostWithTags extends Post {
  tag_ids: string | null;
  tag_names: string | null;
  tag_colors: string | null;
}

export interface NormalizedPost extends Post {
  tags: Tag[];
}

export function normalizePostTags(post: PostWithTags): NormalizedPost {
  const tagIds = post.tag_ids ? post.tag_ids.split(',').map(Number) : [];
  const tagNames = post.tag_names ? post.tag_names.split(',') : [];
  const tagColors = post.tag_colors ? post.tag_colors.split(',') : [];

  return {
    ...post,
    tags: tagIds.map((id, index) => ({
      id,
      name: tagNames[index],
      color: tagColors[index],
    })),
  };
}

export function getAllPublishedPosts(db: Database): NormalizedPost[] {
  const stmt = db.prepare(`
    SELECT p.*, GROUP_CONCAT(t.id) as tag_ids, GROUP_CONCAT(t.name) as tag_names, GROUP_CONCAT(t.color) as tag_colors
    FROM posts p
    LEFT JOIN post_tags pt ON p.id = pt.post_id
    LEFT JOIN tags t ON t.id = pt.tag_id
    WHERE p.published = 1
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `);

  const posts = stmt.all() as PostWithTags[];
  return posts.map(normalizePostTags);
}

export function getPostBySlug(db: Database, slug: string): NormalizedPost | null {
  const stmt = db.prepare(`
    SELECT p.*, GROUP_CONCAT(t.id) as tag_ids, GROUP_CONCAT(t.name) as tag_names, GROUP_CONCAT(t.color) as tag_colors
    FROM posts p
    LEFT JOIN post_tags pt ON p.id = pt.post_id
    LEFT JOIN tags t ON t.id = pt.tag_id
    WHERE p.slug = ?
    GROUP BY p.id
  `);

  const posts = stmt.all(slug) as PostWithTags[];
  if (posts.length === 0) {
    return null;
  }
  return normalizePostTags(posts[0]);
}

export function getPostById(db: Database, id: number): NormalizedPost | null {
  const stmt = db.prepare(`
    SELECT p.*, GROUP_CONCAT(t.id) as tag_ids, GROUP_CONCAT(t.name) as tag_names, GROUP_CONCAT(t.color) as tag_colors
    FROM posts p
    LEFT JOIN post_tags pt ON p.id = pt.post_id
    LEFT JOIN tags t ON t.id = pt.tag_id
    WHERE p.id = ?
    GROUP BY p.id
  `);

  const posts = stmt.all(id) as PostWithTags[];
  if (posts.length === 0) {
    return null;
  }
  return normalizePostTags(posts[0]);
}

export function getPostsByTagId(db: Database, tagId: number): NormalizedPost[] {
  const stmt = db.prepare(`
    SELECT p.*, GROUP_CONCAT(t2.id) as tag_ids, GROUP_CONCAT(t2.name) as tag_names, GROUP_CONCAT(t2.color) as tag_colors
    FROM posts p
    INNER JOIN post_tags pt ON p.id = pt.post_id
    INNER JOIN tags t2 ON t2.id = pt.tag_id
    WHERE p.published = 1 AND p.id IN (
      SELECT post_id FROM post_tags WHERE tag_id = ?
    )
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `);

  const posts = stmt.all(tagId) as PostWithTags[];
  return posts.map(normalizePostTags);
}
