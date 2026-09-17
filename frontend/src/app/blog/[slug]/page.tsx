import Link from "next/link";
import { notFound } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
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
    <main className="min-h-screen bg-paper px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="mb-6 inline-block font-display text-sm font-bold text-ink underline decoration-2 underline-offset-4 hover:bg-butter"
        >
          &lt;- Kembali ke beranda
        </Link>

        <Card as="article" className="overflow-hidden p-0">
          {post.featured_image ? (
            <img
              src={post.featured_image}
              alt={post.title}
              className="h-64 w-full border-b-3 border-ink object-cover sm:h-80"
            />
          ) : null}

          <div className="space-y-6 p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink/60">
              {post.category_name ? (
                <Badge tone="butter">{post.category_name}</Badge>
              ) : null}
              {post.tags && post.tags.length > 0
                ? post.tags.map((tag) => (
                    <Badge key={tag.id} tone="mint">
                      #{tag.name}
                    </Badge>
                  ))
                : null}
            </div>

            <header className="space-y-3">
              <h1 className="font-display text-3xl font-black tracking-tight text-ink md:text-5xl">
                {post.title}
              </h1>
              <p className="font-display text-xs font-bold uppercase tracking-wide text-ink/60">
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
              className="prose max-w-none font-body text-base leading-8 text-ink/80"
              dangerouslySetInnerHTML={{
                __html: post.content,
              }}
            />
          </div>
        </Card>

        <CommentSection postId={post.id} initialComments={comments} />
      </div>
    </main>
  );
}
