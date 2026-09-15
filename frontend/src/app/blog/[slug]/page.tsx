import Link from "next/link";
import { notFound } from "next/navigation";
import CommentSection from "./CommentSection";

type CommentNode = {
  id: number;
  post_id: number;
  user_id: number;
  parent_id?: number | null;
  content: string;
  created_at: string;
  user_name?: string;
  children?: CommentNode[];
};

type Post = {
  id: number;
  title: string;
  slug: string;
  content: string;
  featured_image?: string | null;
  category_name?: string | null;
  category_slug?: string | null;
  created_at?: string;
  tags?: Array<{ id: number; name: string; slug: string }>;
};

const API_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

async function getPostBySlug(slug: string): Promise<Post | null> {
  const res = await fetch(`${API_URL}/posts/${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Failed to fetch article");
  }

  const json = await res.json();
  return json?.data ?? null;
}

async function getCommentsByPost(postId: number): Promise<CommentNode[]> {
  const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return [];
  }

  const json = await res.json();
  return json?.data ?? [];
}

function renderComments(comments: CommentNode[], depth = 0) {
  return comments.flatMap((comment) => [
    <div
      key={comment.id}
      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
      style={{ marginLeft: depth > 0 ? `${depth * 18}px` : 0 }}
    >
      <div className="mb-2 flex items-center justify-between gap-2 text-sm">
        <span className="font-semibold text-slate-800">
          {comment.user_name || "User"}
        </span>
        <span className="text-slate-500">
          {new Date(comment.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
      <p className="whitespace-pre-wrap text-slate-700">{comment.content}</p>
      {comment.children && comment.children.length > 0
        ? renderComments(comment.children, depth + 1)
        : null}
    </div>,
  ]);
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const comments = await getCommentsByPost(post.id);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="mb-6 inline-block text-sm font-medium text-blue-700"
      >
        ← Kembali ke beranda
      </Link>

      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {post.featured_image ? (
          <img
            src={post.featured_image}
            alt={post.title}
            className="h-80 w-full object-cover"
          />
        ) : null}

        <div className="space-y-6 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {post.category_name ? (
              <span className="rounded-full bg-blue-50 px-2 py-1 font-medium text-blue-700">
                {post.category_name}
              </span>
            ) : null}
            {post.tags && post.tags.length > 0
              ? post.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full bg-slate-100 px-2 py-1"
                  >
                    #{tag.name}
                  </span>
                ))
              : null}
          </div>

          <header className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              {post.title}
            </h1>
            <p className="text-sm text-slate-500">
              {post.created_at
                ? new Date(post.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Baru dipublikasikan"}
            </p>
          </header>

          <div
            className="prose max-w-none text-base leading-8 text-slate-700"
            dangerouslySetInnerHTML={{
              __html: post.content,
            }}
          />
        </div>
      </article>

      <CommentSection postId={post.id} initialComments={comments} />
    </main>
  );
}
