export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "author" | "reader";
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface Post {
  id: number;
  user_id: number;
  category_id?: number | null;
  title: string;
  slug: string;
  content: string;
  featured_image?: string | null;
  status: "draft" | "published";
  created_at: string;
  updated_at?: string;
  tags?: Tag[];
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  parent_id?: number | null;
  content: string;
  created_at: string;
  children?: Comment[];
}
