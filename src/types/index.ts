export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  published: number;
  author_id: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  content: string;
  post_id: number;
  author_id: number;
  parent_id?: number;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface SSRData {
  posts?: Post[];
  post?: Post | null;
  [key: string]: unknown;
}
